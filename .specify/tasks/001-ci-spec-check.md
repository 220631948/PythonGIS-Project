# 001-ci-spec-check

Title: Add CI presence check for Spec Kit artefacts

Description:
Add a lightweight CI job that fails PRs when `.specify/spec.md` and `.specify/plan.md` are missing (safety check to ensure spec is included in proposals).

Acceptance Criteria:

- `.github/workflows/spec-check.yml` exists and runs on pull requests.
- The job exits non-zero when required files are absent.
- Documentation (README) references the spec-check job.

Notes:

- This is intentionally conservative: it checks file presence, not running the `specify` CLI. Running the CLI will be added after confirming a stable installation method.
