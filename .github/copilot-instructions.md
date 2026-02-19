# 🧠 GitHub Copilot Agent Instructions (Ralph Wiggum Triple-Check Edition)

_Last updated: 2026-02-19_

Welcome to the Cape Town GeoHub Copilot Agent Guide — the friendly, plain-English playbook for AI coding agents and subagents. Think like Ralph Wiggum: read slowly, check twice, and smile when it works. Keep instructions simple, verifiable, and safe.

---

## Purpose (short)
- Tell the agent what to do, how to behave, and how to coordinate with subagents.
- Provide clear, repeatable steps so changes are small, testable, and auditable.

---

## Agent Modes & Safety (hard rules)
- SAFE_MODE=true (default): write-permissions limited to `.github/`; code changes must be proposed as patch files under `.github/patches/`.
- SAFE_MODE=false: allowed to modify application code **only after explicit human approval**.
- PR labels that change behavior: `agent/run` (execute), `agent/automerge` (merge if CI passes).
- Never add secrets, credentials, or private keys to the repo. If a secret is required, stop and request human help.

---

## Before you act (required pre-flight checks)
1. Read `AGENTS.md` and `README.AGENT_ACTIONS.md` (the repository's agent law).
2. Run `./verify.sh` locally (or equivalent checks): lint, type-check, audits, and tests.
3. Use `grep`/repo search to find related files; prefer reading over guessing.
4. Confirm SAFE_MODE value before any write operation.

---

## How to plan work (Ralph-style, plain steps)
1. Summarize the user's request in one sentence.
2. Break the request into small subtasks (3–8 items). Use `manage_todo_list` for tracking.
3. For each subtask, decide **skill** (frontend/backend/test/docs) and **exit criteria** (what 'done' looks like).
4. Run checks early (lint/type/test) and run them after each change.
5. Prepare a PR or patch with a short description and tests.

Quick example:
- Request: "Add ARIA label to Search button"
- Subtasks: (1) find component, (2) add `aria-label`, (3) add unit test, (4) run `npm run lint` and `npm run test`, (5) open PR.

---

## Subagents: when and how to spawn them
When to spawn:
- Parallelizable tasks (lint + tests + type-check), large reads, or specialized skills (Playwright E2E, accessibility audit).
- Long-running analyses or batch refactors where intermediate verification is required.

How to instruct a subagent (always provide):
- Context: files to read (paths), relevant tests, and the exact question.
- Expected output format: JSON with `summary`, `files_changed[]`, `patches[]` (unified diff or patch content), `commands_run[]`, and `confidence: 0.0-1.0`.
- Time budget and resource limits (e.g., "do not open PRs; return proposed patches only").

Subagent naming convention: `sub/<skill>-<short-desc>-<timestamp>` (helps traceability).

Subagent example prompt (short):
- "Read `frontend/src/components/Search.tsx` and return a patch that adds `aria-label='Search input'`, plus one unit test and the lint output. Return JSON with `patches` and `commands_run`. Do not commit or open PRs."

---

## Agentic thinking (mental model)
- Decompose → Isolate → Implement → Test → Verify → Document → Deliver.
- Prefer small diffs and single-focus PRs.
- If uncertain, produce a proposal (patch) instead of committing code.
- Always provide reproduction steps and commands to verify your change.

---

## Decision rules & escalation (stop & ask humans when)
- Any change to production infra, secrets, or organisation-level CI workflows.
- Large migrations (> 200 lines across multiple files) without tests.
- Ambiguous user instructions or conflicting test results.

When you stop: leave a short note in `hooks/audit.log` and open an issue or draft PR explaining the blocker.

---

## Output & review expectations
- PRs/patches must include: short summary, files changed, tests added, and CI checklist.
- For SAFE_MODE=true produce a patch in `.github/patches/` and add a human-friendly summary.
- Include unit/integration tests when behavior changes.
- Add `Co-authored-by: GitHub Copilot` if the agent authored code.

---

## Useful templates (copy/paste)
Branch name: `ag/<ticket>-<short-desc>`

Commit message:
```
ag:<scope> — <short summary>

Co-authored-by: GitHub Copilot
```

PR template (short):
```
## Summary
- What changed and why

## Verification steps
- Commands to run locally

## CI checks
- [ ] lint
- [ ] type-check
- [ ] tests
```

---

## Logging & audit
- Update `hooks/audit.log` for any write action, including the reason and verification commands run.
- Record the `manage_todo_list` tasks you completed.

---

## Examples (short & clear)
- Fix lint error: find file → apply fix → run `npm run lint` → commit patch → open PR.
- Add endpoint: add route + pydantic schema + unit tests → `ruff check app/` → `pytest` → open PR.

---

## Final checklist (Ralph triple-check)
- [ ] I read related docs (`AGENTS.md`, `README.AGENT_ACTIONS.md`).
- [ ] SAFE_MODE confirmed.
- [ ] Changes are small and test-covered.
- [ ] `verify.sh` passes locally.
- [ ] `hooks/audit.log` updated.

---

Be simple. Be safe. Be like Ralph — read, repeat, triple-check, and celebrate small wins. 🚀
