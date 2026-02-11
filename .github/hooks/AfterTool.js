#!/usr/bin/env node
/**
 * AfterTool Hook
 * Runs after tool execution to validate results and trigger tests
 * Contract: Read JSON from stdin, write JSON to stdout
 * Exit codes: 0=allow/modify, 1=error, 2=deny
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', chunk => input += chunk);

process.stdin.on('end', () => {
  try {
    const toolResult = JSON.parse(input || '{}');
    
    const { tool_name, result, modified_files = [] } = toolResult;
    
    // Run relevant tests for modified files
    const testResults = [];
    
    if (modified_files.length > 0) {
      console.error('🧪 Running tests for modified files...');
      
      // Determine if frontend or backend files were modified
      const frontendFiles = modified_files.filter(f => f.startsWith('frontend/'));
      const backendFiles = modified_files.filter(f => f.startsWith('app/') || f.startsWith('tests/'));
      
      if (backendFiles.length > 0) {
        try {
          execSync('pytest tests/ -x --tb=short', { stdio: 'inherit' });
          testResults.push({ suite: 'backend', status: 'pass' });
        } catch (error) {
          testResults.push({ suite: 'backend', status: 'fail', error: error.message });
        }
      }
      
      if (frontendFiles.length > 0) {
        try {
          execSync('npm run lint --prefix frontend', { stdio: 'inherit' });
          testResults.push({ suite: 'frontend-lint', status: 'pass' });
        } catch (error) {
          testResults.push({ suite: 'frontend-lint', status: 'fail', error: error.message });
        }
      }
    }
    
    // Update project memory with results
    updateProjectMemory({
      category: 'finding',
      source: `AfterTool-${tool_name}`,
      summary: `Tool ${tool_name} executed, ${modified_files.length} files modified`,
      test_results: testResults
    });
    
    // Audit log
    appendAuditLog('AfterTool', {
      timestamp: new Date().toISOString(),
      tool_name,
      modified_files_count: modified_files.length,
      test_results: testResults
    });
    
    console.log(JSON.stringify({ result, test_results: testResults }, null, 2));
    process.exit(0);
    
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
});

function updateProjectMemory(entry) {
  const memoryPath = path.join(process.cwd(), '.github', 'agent-memory', 'project_memory.json');
  if (fs.existsSync(memoryPath)) {
    const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
    memory.entries = memory.entries || [];
    memory.entries.push({
      id: `mem-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ttl_days: 30,
      ...entry
    });
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  }
}

function appendAuditLog(hookId, entry) {
  const auditPath = path.join(process.cwd(), '.github', 'hooks', 'audit.log');
  const logEntry = JSON.stringify({ hook_id: hookId, ...entry });
  fs.appendFileSync(auditPath, logEntry + '\n', { flag: 'a' });
}
