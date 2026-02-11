# Policies Directory

This directory contains policy-as-code definitions that govern repository operations, enforced by SUPER-AGENT v3 hooks and skills.

## Available Policies

### `no-secrets.yaml`
**Severity**: Critical  
**Purpose**: Prevent secrets and credentials from being committed

**Rules**:
- High-entropy string detection
- API key pattern matching
- Password pattern matching
- Token pattern matching
- Database connection string validation
- Cloud provider key detection
- Private key detection

**Enforcement**: `BeforeTool`, `BeforeFileWrite` hooks

### `dependency-allowlist.yaml`
**Severity**: High  
**Purpose**: Control which dependencies and licenses are permitted

**Rules**:
- License allowlist/forbidlist (MIT, Apache-2.0, BSD allowed; GPL/AGPL forbidden)
- Package pinning (critical packages locked to versions)
- Forbidden packages (with alternatives)
- Vulnerability thresholds (0 critical, 0 high, max 3 moderate)

**Enforcement**: `dep-guardian` skill

### `max-pr-size.yaml`
**Severity**: Medium  
**Purpose**: Ensure PRs remain reviewable by limiting size

**Rules**:
- Max 500 lines changed (warn at 300)
- Max 20 files changed (warn at 12)
- Exceptions for refactor, migration, dependencies
- Lock files excluded from count

**Enforcement**: `pr-reviewer` skill

### `protected-files.yaml`
**Severity**: High  
**Purpose**: Require explicit approval for modifying critical files

**Protected Files**:
- `AGENTS.md`, `.github/copilot-instructions.md` (agent config)
- `.github/workflows/*.yml` (CI/CD)
- `requirements.txt`, `package.json` (dependencies)
- `alembic/versions/*.py` (migrations)
- `DATA_SOURCES.md` (attribution)
- `LICENSE`, `ETHICS.md` (legal/ethical)

**Enforcement**: `BeforeFileWrite` hook, `pr-reviewer` skill

## Policy Check Script

All policies are evaluated by `.github/scripts/policy_check.js`, which:
1. Loads all `*.yaml` files from this directory
2. Evaluates rules against proposed changes
3. Returns structured results (pass/fail/warn)
4. Used by CI and pre-commit hooks

## Usage

Policies are automatically enforced. To check manually:

```bash
# Check all policies
node .github/scripts/policy_check.js

# Check specific policy
node .github/scripts/policy_check.js --policy no-secrets

# Check against specific file
node .github/scripts/policy_check.js --file app/config.py
```

## Adding a New Policy

1. Create `new-policy.yaml` in this directory
2. Follow the schema:

```yaml
name: policy-name
version: 1.0.0
description: What this policy enforces
severity: critical|high|medium|low

rules:
  - id: rule-id
    description: What this rule checks
    pattern: "regex or glob"
    action: deny|warn|require_review

enforcement:
  hooks: ["BeforeTool", "BeforeFileWrite"]
  skills: ["skill-name"]

remediation:
  message: |
    Help text for developers when policy is violated
```

3. Register in `.github/agent-manifest.json` policies section
4. Test with mock violations
5. Document in this README

## Overrides

Some policies support overrides in specific circumstances:

- **Emergency Bypass**: Add `emergency-bypass` label (requires post-incident review)
- **Temporary Exemption**: Add exemption block to policy file with expiry date
- **False Positive**: Add exception pattern to policy rules

All overrides are logged to `.github/hooks/audit.log`

## Policy Enforcement Levels

- **Critical**: Block action immediately (exit code 2)
- **High**: Require approval before proceeding
- **Medium**: Warn and add label, but don't block
- **Low**: Log only for metrics

## Integration

Policies integrate with:
- **Hooks**: Enforce at tool/file operation level
- **Skills**: Run policy checks during skill execution
- **CI**: `.github/workflows/agent-ci.yml` runs policy checks
- **Pre-commit**: Local git hooks check policies before commit

## Metrics

Policy violations are tracked in `.github/metrics/policy-violations.json`:

```json
{
  "period": "2026-02",
  "violations": [
    {
      "policy": "no-secrets",
      "rule": "api-key-pattern",
      "count": 2,
      "severity": "critical",
      "blocked": 2
    }
  ]
}
```

Review monthly to identify patterns and improve developer education.
