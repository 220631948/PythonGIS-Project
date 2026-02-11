---
name: dep-guardian
description: Dependency updates, license checks, and vulnerability scanning
metadata:
  version: 0.1.0
  required_tools: ["terminal_runner", "workspace_file_ops"]
  safety_constraints: ["no-writes-outside-.github", "generate-patches-only"]
---

# Dependency Guardian Skill

## Purpose

Monitors and manages project dependencies:

- Automatic vulnerability scanning (npm audit, pip-audit)
- License compliance checking
- Dependency update recommendations
- Allowlist enforcement

## Usage

```bash
# Scan dependencies
agent invoke dep-guardian --scan

# Check license compliance
agent invoke dep-guardian --check-licenses

# Generate update recommendations
agent invoke dep-guardian --recommend-updates
```

## Checks

1. **Security Vulnerabilities**
   - npm audit (frontend)
   - pip-audit --strict (backend)
   - GitHub Security Advisories

2. **License Compliance**
   - Verify all deps match allowlist (`.github/policies/dependency-allowlist.yaml`)
   - Flag GPL/AGPL in non-GPL projects
   - Report missing licenses

3. **Updates**
   - Check for outdated packages
   - Recommend safe updates (minor/patch)
   - Flag major version updates requiring manual review

## Output

```json
{
  "vulnerabilities": {
    "npm": { "critical": 0, "high": 2, "moderate": 5 },
    "pip": { "critical": 0, "high": 0, "moderate": 1 }
  },
  "license_violations": [],
  "update_recommendations": [
    {
      "package": "react",
      "current": "19.0.0",
      "latest": "19.1.0",
      "type": "minor"
    }
  ]
}
```

## Configuration

`.github/skills/dep-guardian/config.yaml`:

```yaml
allowed_licenses:
  - MIT
  - Apache-2.0
  - BSD-3-Clause
  - ISC

forbidden_licenses:
  - GPL-3.0
  - AGPL-3.0

auto_update:
  patch: true
  minor: false
  major: false

vulnerability_thresholds:
  critical: 0 # block on critical
  high: 3 # warn on >3 high
```
