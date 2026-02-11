#!/usr/bin/env node
/**
 * BeforeFileWrite Hook
 * Schema validation before writing files
 * Contract: Read JSON from stdin, write JSON to stdout
 * Exit codes: 0=allow/modify, 1=error, 2=deny
 */

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', chunk => input += chunk);

process.stdin.on('end', () => {
  try {
    const writeRequest = JSON.parse(input || '{}');
    
    const { file_path, content } = writeRequest;
    
    const violations = [];
    
    // 1. Validate JSON/YAML files
    if (file_path.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (error) {
        violations.push({
          rule: 'invalid-json',
          message: `Invalid JSON: ${error.message}`,
          severity: 'critical'
        });
      }
    }
    
    // 2. Schema validation for specific files
    if (file_path.includes('agent-memory')) {
      // Validate memory entry structure
      const memoryData = JSON.parse(content);
      if (!memoryData.entries || !Array.isArray(memoryData.entries)) {
        violations.push({
          rule: 'invalid-memory-schema',
          message: 'Memory file must have "entries" array',
          severity: 'high'
        });
      }
    }
    
    // 3. Prevent overwriting protected files (unless explicit override)
    const protectedFiles = [
      'AGENTS.md',
      'README.md',
      'package.json',
      'requirements.txt'
    ];
    
    const basename = path.basename(file_path);
    if (protectedFiles.includes(basename) && !writeRequest.override_protection) {
      violations.push({
        rule: 'protected-file',
        message: `Attempt to modify protected file: ${basename}`,
        severity: 'high'
      });
    }
    
    // Audit log
    appendAuditLog('BeforeFileWrite', {
      timestamp: new Date().toISOString(),
      file_path,
      decision: violations.length > 0 ? 'deny' : 'allow',
      violations
    });
    
    if (violations.length > 0) {
      const critical = violations.filter(v => v.severity === 'critical');
   if (critical.length > 0) {
        console.error(JSON.stringify({ denied: true, violations }, null, 2));
        process.exit(2);
      }
    }
    
    console.log(JSON.stringify({ allowed: true, content }, null, 2));
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
