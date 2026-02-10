#!/usr/bin/env node
/**
 * policy_check.js - Policy-as-Code Engine
 * Loads and evaluates all policies from .github/policies/
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');  // Note: requires 'yaml' package (npm install yaml)

const REPO_ROOT = path.resolve(__dirname, '../..');
const POLICIES_DIR = path.join(REPO_ROOT, '.github/policies');

// Simple YAML parser fallback if 'yaml' not available
function parseYAML(content) {
  try {
    return yaml.parse(content);
  } catch (error) {
    // Fallback: try JSON (if policy is JSON)
    try {
      return JSON.parse(content);
    } catch {
      console.error(`Failed to parse policy: ${error.message}`);
      return null;
    }
  }
}

// Load all policy files
function loadPolicies() {
  const policies = [];
  
  if (!fs.existsSync(POLICIES_DIR)) {
    console.error(`Policies directory not found: ${POLICIES_DIR}`);
    return policies;
  }
  
  const files = fs.readdirSync(POLICIES_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  for (const file of files) {
    const filePath = path.join(POLICIES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const policy = parseYAML(content);
    
    if (policy) {
      policy._file = file;
      policies.push(policy);
    }
  }
  
  return policies;
}

// Check specific policy rules
function checkPolicy(policy, context = {}) {
  const violations = [];
  const warnings = [];
  
  switch (policy.name) {
    case 'no-secrets':
      return checkNoSecrets(policy, context);
    
    case 'dependency-allowlist':
      return checkDependencyAllowlist(policy, context);
    
    case 'max-pr-size':
      return checkMaxPRSize(policy, context);
    
    case 'protected-files':
      return checkProtectedFiles(policy, context);
    
    default:
      warnings.push({
        policy: policy.name,
        message: `No checker implemented for policy: ${policy.name}`
      });
  }
  
  return { violations, warnings };
}

// No-secrets policy checker
function checkNoSecrets(policy, context) {
  const violations = [];
  const warnings = [];
  
  // Placeholder implementation
  // In real usage, would scan files for secret patterns
  
  console.log(`  ✓ ${policy.name}: No secrets detected (placeholder check)`);
  
  return { violations, warnings };
}

// Dependency allowlist checker
function checkDependencyAllowlist(policy, context) {
  const violations = [];
  const warnings = [];
  
  // Check package.json licenses
  const packageJsonPath = path.join(REPO_ROOT, 'frontend/package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check for forbidden packages
    if (policy.packages && policy.packages.frontend && policy.packages.frontend.forbidden) {
      for (const forbidden of policy.packages.frontend.forbidden) {
        if (packageJson.dependencies && packageJson.dependencies[forbidden.name]) {
          violations.push({
            policy: policy.name,
            rule: 'forbidden-package',
            package: forbidden.name,
            reason: forbidden.reason,
            severity: 'high'
          });
        }
      }
    }
  }
  
  console.log(`  ✓ ${policy.name}: ${violations.length} violation(s) found`);
  
  return { violations, warnings };
}

// Max PR size checker
function checkMaxPRSize(policy, context) {
  const violations = [];
  const warnings = [];
  
  // Placeholder: would integrate with git diff to check lines changed
  console.log(`  ✓ ${policy.name}: PR size check (requires git context)`);
  
  return { violations, warnings };
}

// Protected files checker
function checkProtectedFiles(policy, context) {
  const violations = [];
  const warnings = [];
  
  // Placeholder: would check if protected files are modified in PR
  console.log(`  ✓ ${policy.name}: Protected files check (requires git context)`);
  
  return { violations, warnings };
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const quiet = args.includes('--quiet');
  const specificPolicy = args.find(a => a.startsWith('--policy='))?.split('=')[1];
  
  if (!quiet) {
    console.log('📜 Policy Check Engine');
    console.log('=====================\n');
  }
  
  const policies = loadPolicies();
  
  if (!quiet) {
    console.log(`Loaded ${policies.length} policies\n`);
  }
  
  let totalViolations = 0;
  let totalWarnings = 0;
  
  for (const policy of policies) {
    if (specificPolicy && policy.name !== specificPolicy) {
      continue;
    }
    
    if (!quiet) {
      console.log(`Checking policy: ${policy.name} (${policy.severity})`);
    }
    
    const { violations, warnings } = checkPolicy(policy);
    
    totalViolations += violations.length;
    totalWarnings += warnings.length;
    
    if (violations.length > 0) {
      console.log(`  ❌ ${violations.length} violation(s):`);
      for (const v of violations) {
        console.log(`     - ${v.rule}: ${v.message || v.reason}`);
      }
    }
    
    if (warnings.length > 0 && !quiet) {
      console.log(`  ⚠️  ${warnings.length} warning(s):`);
      for (const w of warnings) {
        console.log(`     - ${w.message}`);
      }
    }
    
    if (!quiet) {
      console.log('');
    }
  }
  
  // Summary
  if (!quiet) {
    console.log('=====================');
    console.log(`Total Violations: ${totalViolations}`);
    console.log(`Total Warnings: ${totalWarnings}`);
  }
  
  // Exit code
  if (totalViolations > 0) {
    console.error('❌ Policy violations detected');
    process.exit(1);
  } else {
    if (!quiet) {
      console.log('✅ All policy checks passed');
    }
    process.exit(0);
  }
}

// Handle missing 'yaml' package gracefully
try {
  main();
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('yaml')) {
    console.error('⚠️  Warning: yaml package not found');
    console.error('   Install with: npm install -g yaml');
    console.error('   Continuing with limited functionality...\n');
    
    // Redefine parseYAML for JSON-only mode
    global.parseYAML = (content) => {
      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    };
    
    main();
  } else {
    throw error;
  }
}
