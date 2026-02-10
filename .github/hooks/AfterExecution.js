#!/usr/bin/env node
/**
 * AfterExecution Hook
 * Archive run logs and produce explainability summary
 * Contract: Read JSON from stdin, write JSON to stdout
 * Exit codes: 0=allow/modify, 1=error, 2=deny
 */

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', chunk => input += chunk);

process.stdin.on('end', () => {
  try {
    const executionResult = JSON.parse(input || '{}');
    
    const { actions_taken, findings, duration_ms, agent_mode } = executionResult;
    
    // Archive session memory
    const sessionMemoryPath = path.join(process.cwd(), '.github', 'agent-memory', 'session_memory.json');
    if (fs.existsSync(sessionMemoryPath)) {
      const sessionMemory = JSON.parse(fs.readFileSync(sessionMemoryPath, 'utf8'));
      
      // Add execution summary
      sessionMemory.entries = sessionMemory.entries || [];
      sessionMemory.entries.push({
        id: `exec-${Date.now()}`,
        category: 'decision',
        source: 'AfterExecution',
        timestamp: new Date().toISOString(),
        summary: `Execution completed in ${duration_ms}ms`,
        detail: `Actions: ${actions_taken || 0}, Mode: ${agent_mode || 'unknown'}`,
        ttl_days: 7
      });
      
      fs.writeFileSync(sessionMemoryPath, JSON.stringify(sessionMemory, null, 2));
    }
    
    // Generate explainability summary
    const summary = {
      execution_summary: {
        timestamp: new Date().toISOString(),
        duration_ms,
        agent_mode,
        actions_taken
      },
      findings: findings || [],
      artifacts_generated: listArtifacts(),
      next_steps: generateNextSteps(executionResult)
    };
    
    // Write summary
    const summaryPath = path.join(process.cwd(), '.github', 'agent-memory', 'last-execution-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Audit log
    appendAuditLog('AfterExecution', {
      timestamp: new Date().toISOString(),
      duration_ms,
      actions_taken,
      findings_count: (findings || []).length
    });
    
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
    
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
});

function listArtifacts() {
  const artifacts = [];
  const patchesDir = path.join(process.cwd(), '.github', 'patches');
  
  if (fs.existsSync(patchesDir)) {
    const files = fs.readdirSync(patchesDir);
    artifacts.push(...files.map(f => `patches/${f}`));
  }
  
  return artifacts;
}

function generateNextSteps(executionResult) {
  const steps = [];
  
  if (executionResult.findings && executionResult.findings.length > 0) {
    steps.push('Review findings in .github/findings.json');
  }
  
  const patchesDir = path.join(process.cwd(), '.github', 'patches');
  if (fs.existsSync(patchesDir) && fs.readdirSync(patchesDir).length > 0) {
    steps.push('Review generated patches in .github/patches/');
    steps.push('Apply patches manually or via PR after review');
  }
  
  steps.push('Run .github/scripts/verify.sh to validate changes');
  
  return steps;
}

function appendAuditLog(hookId, entry) {
  const auditPath = path.join(process.cwd(), '.github', 'hooks', 'audit.log');
  const logEntry = JSON.stringify({ hook_id: hookId, ...entry });
  fs.appendFileSync(auditPath, logEntry + '\n', { flag: 'a' });
}
