#!/usr/bin/env node
/**
 * BeforeTool Hook
 * Validates tool inputs before execution
 * Contract: Read JSON from stdin, write JSON to stdout
 * Exit codes: 0=allow/modify, 1=error, 2=deny
 */

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', chunk => input += chunk);

process.stdin.on('end', () => {
  try {
    const toolCall = JSON.parse(input || '{}');
    
    const { tool_name, parameters } = toolCall;
    
    // Security checks
    const violations = [];
    
    // 1. Path traversal check
    if (parameters.file_path || parameters.path || parameters.dirPath) {
      const pathToCheck = parameters.file_path || parameters.path || parameters.dirPath;
      if (pathToCheck.includes('..') || pathToCheck.startsWith('/etc') || pathToCheck.startsWith('/root')) {
        violations.push({
          rule: 'path-traversal',
          message: `Suspicious path detected: ${pathToCheck}`,
          severity: 'critical'
        });
      }
    }
    
    // 2. Write path restriction (SAFE_MODE enforcement)
    if (tool_name === 'workspace_file_ops' && parameters.op === 'write') {
      const filePath = parameters.file_path || '';
      const projectRoot = process.cwd();
      const githubDir = path.join(projectRoot, '.github');
      
      if (!filePath.startsWith('.github/') && !filePath.startsWith(githubDir)) {
        violations.push({
          rule: 'write-outside-github',
          message: `Write to ${filePath} blocked. SAFE_MODE only allows .github/ writes.`,
          severity: 'critical'
        });
      }
    }
    
    // 3. Shell command blacklist
    if (tool_name === 'terminal_runner' || tool_name === 'run_shell_command') {
      const cmd = parameters.cmd || parameters.command || '';
      const blacklist = ['rm -rf /', 'sudo', 'ssh', 'scp', 'dd if='];
      
      for (const forbidden of blacklist) {
        if (cmd.includes(forbidden)) {
          violations.push({
            rule: 'blacklisted-command',
            message: `Forbidden command detected: ${forbidden}`,
            severity: 'critical'
          });
        }
      }
    }
    
    // 4. Secret detection in content
    if (parameters.content) {
      const secretPatterns = [
        /api[_-]?key[\s:=]+\S+/gi,
        /password[\s:=]+\S+/gi,
        /secret[\s:=]+\S+/gi,
        /token[\s:=]+\S+/gi,
        /dsn[\s:=]+\S+/gi
      ];
      
      for (const pattern of secretPatterns) {
        if (pattern.test(parameters.content)) {
          violations.push({
            rule: 'secret-detected',
            message: 'Potential secret detected in content',
            severity: 'high'
          });
        }
      }
    }
    
    // Audit log
    appendAuditLog('BeforeTool', {
      timestamp: new Date().toISOString(),
      tool_name,
      decision: violations.length > 0 ? 'deny' : 'allow',
      violations
    });
    
    if (violations.length > 0) {
      // Deny critical violations
      const critical = violations.filter(v => v.severity === 'critical');
      if (critical.length > 0) {
        console.error(JSON.stringify({ denied: true, violations }, null, 2));
        process.exit(2);
      }
    }
    
    // Allow (possibly with modifications)
    console.log(JSON.stringify({ allowed: true, parameters }, null, 2));
    process.exit(0);
    
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
});

function appendAuditLog(hookId, entry) {
  const auditPath = path.join(process.cwd(), '.github', 'hooks', 'audit.log');
  const logEntry = JSON.stringify({ hook_id: hookId, ...entry });
  fs.appendFileSync(auditPath, logEntry + '\n', { flag: 'a' });
}
