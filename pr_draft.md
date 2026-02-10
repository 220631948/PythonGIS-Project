# ag:super-v3 — Add policy-as-code scaffolding, verify script, and initial agent artifacts


Summary:
This draft PR adds initial agent artifacts to enable policy-as-code enforcement and project verification in the repository. All changes are limited to the .github directory and repository root (verify.sh, findings.json, patches/) and are intended as low-risk, SAFE_MODE proposals.

Changes included (files under patches/):

- patches/0001-remove-unused-import.patch — remove unused import (patch only; not applied)
- patches/0002-update-agent-manifest-outputs.patch — update agent-manifest outputs
- patches/0003-add-findings.patch — add findings.json (summary)
- patches/0004-fix-policies.patch — escape sequences and YAML fixes for policy files
- patches/0005-verify-run-policy-check.patch — verify.sh policy check enhancements
- verify.sh — top-level verification script
- findings.json — scan results (F001..F008)
- README.AGENT_ACTIONS.md — human-readable summary of agent actions
- .github/agent-manifest.json — manifest updated to match generated artifacts
- .github/agent-memory/* — session + project memory updated with scan results
- .github/scripts/policy_check.js — simple policy-as-code runner (placeholder)
- .github/policies/* — initial policy definitions (no-secrets, dependency-allowlist, max-pr-size, protected-files)

Findings referenced:

- F001 (high): Frontend TypeScript errors (18 errors) — blocks CI type-check
- F002 (medium): ESLint warnings (85) — many 'no-explicit-any' occurrences
- F003 (high): Site suitability module contains multiple TODOs for PostGIS wiring
- F004 (medium): Admin endpoints unprotected when ADMIN_API_KEY is empty
- F005 (low): Ruff fixable unused import in app/api/advanced_analysis_api.py (patch provided)
- F006 (low): Policies added (initial set) — review required
- F007 (medium): Sample DB connection string includes a placeholder password (app/core/database.py)
- F008 (low): SonarQube not bound to workspace; unable to run Sonar analysis

Testing & Verification:

- verify.sh added to run a set of non-destructive checks (lint, type-check, limited tests, secret grep, policy checks)

- Policy check runner (.github/scripts/policy_check.js) validated locally (parsing and placeholder checks)

- Full CI integration is recommended (add policy_check step to .github/workflows/ci.yml)

Rollback & Safety:

- SAFE_MODE=true: No source code changes were applied. All patches are generated under patches/ for manual review and application.

- To revert these .github changes, remove files introduced/modified in this PR and restore previous files from master.

Next steps (requested confirmation):

1. Review this PR and provide approval to create it (SAFE_MODE allows PR creation for .github changes).

2. Optionally: apply small safe fixes (e.g., remove unused import) and open a follow-up PR merging those patches.

3. Triage frontend TypeScript errors and create issues/assign to frontend maintainers.

4. Plan and implement PostGIS wiring for site_suitability.py with seed data and deterministic tests.

5. Configure SonarQube connected mode or add alternative security scanner to CI.

Notes:

- This PR is intentionally scoped to infrastructure (.github, verify.sh) and findings. It does not apply any changes to app/ or frontend/src/ code without explicit confirmation.

- See findings.json for detailed severity, suggested actions, and confidence.
