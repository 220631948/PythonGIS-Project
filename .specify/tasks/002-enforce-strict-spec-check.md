# 002-enforce-strict-spec-check

Title: Enforce Strict Spec Check in CI

Description:
Toggle the CI `specify-check` job to require `specify check` to succeed (no fallback) and ensure the Specify CLI installs reliably in GitHub Actions.

Acceptance criteria:

- The `specify-check` job runs `specify check` and fails if the check returns non-zero.
- `SPECIFY_STRICT=true` can be set in the workflow or via a repository setting for enforcement.
- The job uploads `specify-check.log` for debugging on failure.
- PRs that violate spec rules are blocked until spec is corrected.

Notes:

- This task should be executed only after the `specify` CLI demonstrates consistent installation success in Actions (>= 3 successful runs).
- Consider publishing `specify` to PyPI or pinning an explicit tag/release for reproducible installs.
