---
name: pr-reviewer
description: Automated PR content, tests, security, and policy compliance checks
version: 0.1.0
triggers:
  - pattern: "pull_request.*"
    intent: "review-pr"
  - pattern: "review.*pr.*"
    intent: "manual-review"
required_tools:
  - git_history_analysis
  - pull_request_manager
  - api_schema_validate
  - test_runner
  - workspace_file_ops
safety_constraints:
  - "no-writes-outside-.github"
  - "read-only-for-code-analysis"
  - "generate-patches-only"
author: "SUPER-AGENT v3"
last_updated: "2026-02-10"
---

# PR Reviewer Skill

## Purpose

Automated pull request reviewer that checks:

- Code quality and style compliance
- Test coverage and status
- Security vulnerabilities
- Spatial integrity (CRS consistency)
- API contract compliance
- Policy violations (max PR size, protected files, etc.)

## Usage Examples

### Automatic Trigger

PR reviewer skill automatically triggers on:

- `pull_request.opened`
- `pull_request.synchronize`
- `pull_request.reopened`

### Manual Invocation

```bash
# From agent CLI
agent invoke pr-reviewer --pr-number 123

# From comment in PR
/review pr with pr-reviewer skill
```

## Checks Performed

### 1. Code Quality

- ESLint (frontend)
- Ruff (backend)
- TypeScript strict mode compliance
- PEP8 adherence

### 2. Testing

- Unit test coverage (minimum thresholds)
- Integration tests status
- E2E tests for UI changes
- Backend pytest status

### 3. Security

- `npm audit` results
- `pip-audit --strict` results
- Secret detection scan
- Dependency vulnerability check

### 4. Spatial Integrity (Cape Town GeoHub Specific)

- CRS consistency (EPSG:4326 for I/O, EPSG:32734 for analysis)
- GeoJSON RFC 7946 compliance
- Coordinate order validation (Leaflet vs GeoJSON)

### 5. API Contracts

- Backend OpenAPI schema validation
- Frontend TypeScript types match backend DTOs
- Breaking change detection

### 6. Policies

- Max PR size (configurable via `.github/policies/max-pr-size.yaml`)
- Protected files not modified without approval
- Commit message format compliance
- Attribution preserved (DATA_SOURCES.md)

## Output Format

```json
{
  "pr_number": 123,
  "status": "pass|fail|warning",
  "checks": [
    {
      "name": "code-quality",
      "status": "pass",
      "details": "All linters passed"
    },
    {
      "name": "security",
      "status": "warning",
      "details": "3 moderate npm audit findings",
      "findings": ["..."]
    }
  ],
  "recommendations": [
    "Consider adding unit tests for new spatial utility functions",
    "Update DATA_SOURCES.md attribution for new dataset"
  ],
  "patch_generated": true,
  "patch_path": ".github/patches/pr-123-fixes.patch"
}
```

## Configuration

Place configuration in `.github/skills/pr-reviewer/config.yaml`:

```yaml
min_coverage:
  backend: 80
  frontend: 75
max_pr_size: 500 # lines changed
require_tests_for_new_code: true
enforce_spatial_integrity: true
```

## Remediation

When issues are detected, the skill:

1. Generates a findings entry in `.github/findings.json`
2. Creates a patch under `.github/patches/` with suggested fixes (SAFE_MODE)
3. Posts a comment on the PR with actionable feedback
4. Optionally requests changes if critical issues found

## Dependencies

- git
- jq
- Node.js (for npm audit)
- Python 3.11+ (for pip-audit)
- GitHub CLI (gh) for API access

## Testing

Run unit tests:

```bash
bash .github/skills/pr-reviewer/tests/test_pr_reviewer.sh
```

## References

- [GitHub PR Review API](https://docs.github.com/en/rest/pulls/reviews)
- [Cape Town GeoHub AGENTS.md](../../../AGENTS.md)
- [Policy Definitions](../../policies/)
