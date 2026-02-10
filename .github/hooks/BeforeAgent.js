#!/usr/bin/env node
/**
 * BeforeAgent Hook
 * Runs before agent initialization
 * Contract: Read JSON from stdin, write JSON to stdout
 * Exit codes: 0=allow/modify, 1=error, 2=deny
 */

const fs = require('fs');
const path = require('path');

// Read stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);

process.stdin.on('end', () => {
  try {
    const context = JSON.parse(input || '{}');
    
    // Initialize memory
    const projectRoot = process.cwd();
    const memoryDir = path.join(projectRoot, '.github', 'agent-memory');
    
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    // Load project memory
    const projectMemoryPath = path.join(memoryDir, 'project_memory.json');
    let projectMemory = { entries: [] };
    
    if (fs.existsSync(projectMemoryPath)) {
      projectMemory = JSON.parse(fs.readFileSync(projectMemoryPath, 'utf8'));
    }
    
    // Enrich context with memory
    const enrichedContext = {
      ...context,
      memory: projectMemory,
      repo_root: projectRoot,
      agent_manifest: loadAgentManifest(projectRoot)
    };
    
    // Append to audit log
    appendAuditLog('BeforeAgent', {
      timestamp: new Date().toISOString(),
      decision: 'allow',
      context_enriched: true
    });
    
    // Output enriched context
    console.log(JSON.stringify(enrichedContext, null, 2));
    
    process.exit(0);
    
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
});

function loadAgentManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, '.github', 'agent-manifest.json');
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  return null;
}

function appendAuditLog(hookId, entry) {
  const auditPath = path.join(process.cwd(), '.github', 'hooks', 'audit.log');
  const logEntry = JSON.stringify({ hook_id: hookId, ...entry });
  fs.appendFileSync(auditPath, logEntry + '\n', { flag: 'a' });
}
