# plan.md — Initial Plan for Cape Town GeoHub (Spec Kit)

## Objective
Create a small, practical Spec Kit scaffold to enable spec-driven development for Cape Town GeoHub and to make it easier for coding agents (Copilot, Claude, etc.) to reason about work.

## Phases

1. Bootstrap Spec Kit (this commit)
   - Add `.specify/spec.md` and `.specify/plan.md` with minimal content.
   - Add `.specify/tasks/` with starter tasks.
   - Add lightweight CI check to verify presence of spec artefacts.

2. Operationalize
   - Install and validate the `specify` CLI in a developer environment.
   - Add `specify check` step to CI once installation approach is validated.
   - Integrate spec-driven tasks into issue tracker/board.

3. Expand
   - Add per-phase plans and task decomposition for upcoming sprints (Phase 4, Phase 5, etc.).
   - Use Spec Kit prompts (`.github/prompts`) for plan/task regeneration and agent-driven authoring.

## Acceptance Criteria
- A visible spec and plan exist in `.specify/` and are referenced in README.
- A CI job (`spec-check`) verifies these artefacts on PRs to master/develop.

## Risks & Mitigations
- Installing the `specify` CLI in CI may introduce extra tooling maintenance. Start with a presence check; add CLI-based checks later.

## Owners
- Maintainers: @geohub-team (placeholder)

***
