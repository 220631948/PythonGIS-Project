# 000-bootstrap-spec

Title: Bootstrap Spec Kit for repository

Description:
Create an initial Spec Kit scaffold so the project can start using spec-driven development workflows.

Acceptance criteria:
- `.specify/spec.md` exists and describes stage, goals, and acceptance criteria.
- `.specify/plan.md` exists and outlines the initial phases.
- `.github/prompts/specify.prompt.md` and supporting prompts exist.
- `.github/workflows/spec-check.yml` exists and verifies `.specify/` artefacts are present.

Notes:
- This task is performed as part of the documentation improvements (AGENTS.md and Copilot instructions updates).
- Next task: update CI to run `specify check` when the CLI path/install is confirmed.
