# Scripts Directory

This directory contains utility scripts for SUPER-AGENT v3 and Cape Town GeoHub operations.

## Available Scripts

### `verify.sh`

Comprehensive local verification runner that checks:

- Repository structure
- Agent infrastructure (skills, hooks, policies, memory)
- Policy files presence
- Backend and frontend dependencies
- Linting (ruff for Python, ESLint for TypeScript)
- Type checking (TypeScript strict mode)
- Security audits (npm audit, pip-audit)
- Tests (pytest backend, Vitest frontend)
- Policy compliance

**Usage**:

```bash
# Run all checks
bash .github/scripts/verify.sh

# Run in CI
bash .github/scripts/verify.sh --ci
```

**Exit Codes**:
- `0`: All critical checks passed
- `1`: One or more checks failed

**Requirements**:
- Node.js (for frontend checks)
- Python 3.11+ (for backend checks)
- ruff, pip-audit (installable via pip)

### `policy_check.js`

Policy-as-code evaluation engine that loads and checks policies from `.github/policies/`.

**Usage**:

```bash
# Check all policies
node .github/scripts/policy_check.js

# Check specific policy
node .github/scripts/policy_check.js --policy=no-secrets

# Quiet mode (CI-friendly)
node .github/scripts/policy_check.js --quiet

# Check against specific file
node .github/scripts/policy_check.js --file=app/config.py
```

**Supported Policies**:
- `no-secrets` - Secret detection
- `dependency-allowlist` - License and package validation
- `max-pr-size` - PR size limits
- `protected-files` - Critical file modification checks

**Exit Codes**:
- `0`: All policies passed
- `1`: Policy violations detected

**Integration**:
- Called by `.github/hooks/` scripts
- Used in `.github/workflows/agent-ci.yml`
- Can be run as pre-commit hook

**Dependencies**:
- Node.js 16+
- `yaml` package (optional, for YAML parsing): `npm install -g yaml`

## Running in CI

Both scripts are designed for CI integration:

```yaml
# .github/workflows/agent-ci.yml
- name: Verify Infrastructure
  run: bash .github/scripts/verify.sh --ci

- name: Check Policies
  run: node .github/scripts/policy_check.js --quiet
```

## Local Development

Add to your local workflow:

```bash
# Before committing
bash .github/scripts/verify.sh && git commit

# Or as a git pre-commit hook
ln -s ../../.github/scripts/verify.sh .git/hooks/pre-commit
```

## Extending Scripts

To add new checks to `verify.sh`:

1. Add check function following pattern:
   ```bash
   # Check N: Description
   echo "🔍 Checking X..."
   if [[ condition ]]; then
     pass "X is valid"
   else
     fail "X failed"
   fi
   ```

2. Update summary counters

To add new policy checker to `policy_check.js`:

1. Add case in `checkPolicy()` switch
2. Implement `checkPolicyName()` function
3. Return `{ violations, warnings }`

## Troubleshooting

### `verify.sh fails on linting`

```bash
# Backend
ruff check app/ --fix

# Frontend
cd frontend && npm run lint --fix
```

### `policy_check.js cannot parse YAML`

Install the `yaml` package:

```bash
npm install -g yaml
```

Or convert policies to JSON (less readable).

### `verify.sh fails on missing tools`

Install required tools:

```bash
# Python tools
pip install ruff pip-audit pytest

# Node tools
cd frontend && npm install
```

## Output Examples

### verify.sh Success

```
🔍 Cape Town GeoHub Verification Suite
=======================================

📁 Checking repository structure...
✅ PASS: Repository structure valid

🤖 Checking agent infrastructure...
✅ PASS: .github/agents/ exists
...

=======================================
📊 VERIFICATION SUMMARY
=======================================
Passed: 28
Warnings: 2
Failed: 0

✅ All critical checks passed!
⚠️  2 warning(s) - review recommended
```

### policy_check.js Output

```
📜 Policy Check Engine
=====================

Loaded 4 policies

Checking policy: no-secrets (critical)
  ✓ no-secrets: No secrets detected

Checking policy: dependency-allowlist (high)
  ✓ dependency-allowlist: 0 violation(s) found

=====================
Total Violations: 0
Total Warnings: 0
✅ All policy checks passed
```
