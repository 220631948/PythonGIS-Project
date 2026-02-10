# GitHub Copilot Instructions - Cape Town GeoHub

**Project Identity**: Cape Town GeoHub is a geospatial decision-support platform built on **FastAPI** (Backend), **React 19 + Vite** (Frontend), **Leaflet** (Mapping), and **GeoPandas** (Spatial Analysis).

## Architecture

**Map-First Dashboard**: The application structure is divided into three layers:

1. **Frontend** (`frontend/src/`): React 19 + Vite, Leaflet for maps, feature-based modules.
2. **Backend** (`app/`): FastAPI serving GeoJSON via `/api`, using GeoPandas for spatial operations.
3. **Data Pipeline**: ArcGIS Open Data → local cache → API.

**Module-per-Feature**: Structure frontend features by domain (e.g., `src/modules/services/`, `src/modules/transport/`) with matching backend routes (`app/api/transport.py`).

## Code Standards

**Beta (CI-gated)**:

- **Strict Linting**: Zero tolerance for ESLint errors.
- **Type Checks**: No `any` types allowed in TypeScript.
- **Audits**: `npm audit` and `pip-audit --strict` must pass.

**Styling**:

- Use **CSS Variables** (`index.css`) for design tokens (colors, spacing).
- Use **Tailwind CSS** utilities that align with these tokens.
- Avoid hardcoded hex codes.

**State Management**:

- **No Redux**. Use React Context + Hooks.
- Mandatory usage of `useOfflineData` hook for offline-capable data synchronization (IndexedDB).

## Agent Mode — Overview

When operating in **Agent Mode**, follow the full Agent Actions manual at
[`./README.AGENT_ACTIONS.md`](./README.AGENT_ACTIONS.md). It is the
**canonical, authoritative** source for agent actions, commit conventions,
rollback procedures, and `SAFE_MODE` constraints. Treat it as the execution
playbook before making any changes.

**When does Agent Mode apply?**

- `SAFE_MODE=true` (default) — the agent may only write to `.github/` and
  must propose application-code changes via patch files in `.github/patches/`.
- `SAFE_MODE=false` — only when enabled by **explicit user confirmation**;
  allows direct writes to `app/`, `frontend/src/`, and `tests/`.
- Any PR labeled `agent/run` or `agent/automerge`.
- When a task is explicitly assigned to an autonomous agent.

**Primary References** (always consult before acting):

| Document                                                 | Purpose                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| [`./README.AGENT_ACTIONS.md`](./README.AGENT_ACTIONS.md) | Step-by-step agent actions, safety rules, rollback            |
| [`../AGENTS.md`](../AGENTS.md)                           | Project-level agent roles, testing strategy, review protocol  |
| [`./.github/AGENTS.md`](./AGENTS.md)                     | `.github/`-scoped operational modes (SAFE_MODE / FULL_ACCESS) |
| [`./agent-manifest.json`](./agent-manifest.json)         | Repository layout and agent configuration map                 |

---

### `.github/` Resources the Agent Uses

The `.github/` directory is the single source of truth for agent
infrastructure. Below is every resource the agent must know about.

#### Workflows (CI/CD)

Consult these before proposing or applying changes to ensure CI alignment:

- [`workflows/agent-ci.yml`](./workflows/agent-ci.yml) — agent infrastructure validation and full quality gates.
- [`workflows/ci.yml`](./workflows/ci.yml) — core CI checks (lint, type-checks, tests).
- [`workflows/pip-audit.yml`](./workflows/pip-audit.yml) — backend dependency audit.
- [`workflows/spec-check.yml`](./workflows/spec-check.yml) — specification and contract validation.
- [`workflows/specify-check.yml`](./workflows/specify-check.yml) — spec completeness checks.
- [`workflows/deploy.yml`](./workflows/deploy.yml) — deployment pipeline expectations.
- [`workflows/branch-cleanup.yml`](./workflows/branch-cleanup.yml) — branch lifecycle automation.

#### Agents (role manifests)

Agent definitions in [`agents/`](./agents/) describe capabilities and
constraints for each specialist:

- `backend-fastapi-expert.agent.md` — FastAPI endpoint generation.
- `database-alembic-expert.agent.md` — Alembic migration management.
- `devops-docker-expert.agent.md` — Docker & Compose optimization.
- `frontend-react-expert.agent.md` — Type-safe React component generation.
- `git-expert.agent.md` — Git operations (merge, branch, review).
- `git-workflow-automation.agent.md` — Automated git workflows.
- `god-mode-gemini.agent.md` — Full-stack repair and QA automation director.
- `spatial-geojson-expert.agent.md` — GeoJSON creation & validation.
- `spatial-geopandas-expert.agent.md` — GeoPandas spatial operations.
- `testing-test-generator.agent.md` — Comprehensive test generation.

#### Hooks (lifecycle enforcement)

Hooks in [`hooks/`](./hooks/) enforce safety at every stage. All follow a
JSON stdin/stdout contract with exit codes `0` (allow), `1` (error),
`2` (deny):

- `BeforeAgent.js` — initialise memory, enrich context, prepare environment.
- `BeforeTool.js` — validate tool inputs, enforce path restrictions and secret rules.
- `AfterTool.js` — run tests, update memory, validate results.
- `BeforeFileWrite.js` — schema validation, protected-file checks.
- `AfterExecution.js` — archive logs, generate summary, list next steps.
- `audit.log` — append-only log of every hook decision (JSONL).

#### Policies (policy-as-code)

Policy files in [`policies/`](./policies/) are enforced by hooks and CI:

- `no-secrets.yaml` — detect API keys, passwords, tokens, connection strings.
- `dependency-allowlist.yaml` — license allowlist (MIT/Apache-2.0/BSD allowed;
  GPL/AGPL forbidden), pinning, vulnerability thresholds.
- `max-pr-size.yaml` — PR size limits (500 lines, 20 files; exceptions for
  refactor/migration).
- `protected-files.yaml` — guard critical files (`AGENTS.md`, workflows,
  `requirements.txt`) — require approval.

#### Scripts (verification & policy runners)

Scripts in [`scripts/`](./scripts/) are the go-to automation entrypoints:

- `verify.sh` — comprehensive local verification runner.
  Run: `bash .github/scripts/verify.sh`
- `policy_check.js` — policy evaluation engine.
  Run: `node .github/scripts/policy_check.js`

#### Skills (7 foundational capabilities)

Skills in [`skills/`](./skills/) each contain a `SKILL.md` manifest,
executable helpers, and unit tests:

| Skill                   | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `pr-reviewer`           | Automated PR content, tests, security, and policy compliance checks    |
| `dep-guardian`          | Dependency updates, license checks, vulnerability scanning             |
| `design-linter`         | UI consistency, design token normalisation, design-system extraction   |
| `ui-crawler`            | Interactive element discovery and visual regression harness            |
| `api-adapter`           | Typed SDK generation from OpenAPI/GraphQL; contract mismatch detection |
| `refactor-strategist`   | Safe automated refactoring with rollback scripts and migration plans   |
| `accessibility-auditor` | WCAG 2.1 AA compliance checking with axe-core and remediation patches  |

#### Agent Memory

Persistent context in [`agent-memory/`](./agent-memory/) — read at session
start, write at every major decision:

- `session_memory.json` — ephemeral per-session context.
- `project_memory.json` — long-lived architectural decisions and progress.
- `global_agent_memory.json` — cross-session agent state.

#### Prompts

Reusable prompt templates in [`prompts/`](./prompts/):

- `plan.prompt.md` — planning phase prompt.
- `specify.prompt.md` — specification phase prompt.
- `tasks.prompt.md` — task decomposition prompt.

#### Schemas

JSON schemas in [`schemas/`](./schemas/) for structured output validation:

- `findings-entry.schema.json` — schema for `findings.json` entries.

#### PR Templates & Automation

Use these automatically when creating PRs in agent mode:

- [`PULL_REQUEST_TEMPLATE.md`](./PULL_REQUEST_TEMPLATE.md)
- [`pull_request_template.yml`](./pull_request_template.yml)
- [`pull_request.yml`](./pull_request.yml)

#### Copilot Configuration

Additional Copilot customisation lives in [`copilot/`](./copilot/) including
docs, examples, instructions, prompts, and templates.

#### Patches & Templates

- [`patches/`](./patches/) — generated patch files when `SAFE_MODE=true`.
- [`templates/`](./templates/) — ready for PR/issue templates (currently empty).

---

### Commit, Branch & PR Conventions

**Branch naming**:

```
ag/<ticket>-<short-desc>   # e.g. ag/42-fix-aria-labels
ag/auto/<timestamp>         # e.g. ag/auto/1707580800
```

**Commit message format**:

```
ag:<scope> — <short summary>

Co-authored-by: <agent-name>
```

**PR body** (minimum fields):

```markdown
## Summary

- What changed and why (root cause).
- Datasets / CRS implications.

## Files Changed

- list of files

## Tests Added

- list of tests

## CI Jobs That Must Pass

- [ ] `npm run lint`
- [ ] `npm run type-check`
- [ ] `npm run build`
- [ ] `npm audit`
- [ ] `ruff check app/`
- [ ] `pip-audit -r requirements.txt --strict`
- [ ] `pytest`

## Rollback

- `git revert <sha>`
- Restore DB with backups if migration was involved.
```

---

### Automated Actions the Agent May Perform

**Allowed** (when `SAFE_MODE=true` — changes must be reversible):

- Small non-breaking refactors.
- Adding `aria-label` and keyboard navigation attributes.
- Writing unit tests.
- Design token extraction and normalisation.
- Generating patch files in `.github/patches/`.

**Disallowed without human review**:

- Breaking API changes.
- Database migrations without migration scripts and backups.
- Secret or credential modifications.
- Deleting or overwriting protected files (see `policies/protected-files.yaml`).

---

### Agent Mode Execution Rules

1. **Read** [`README.AGENT_ACTIONS.md`](./README.AGENT_ACTIONS.md) before
   drafting PRs or patches.
2. **Read** [`AGENTS.md`](./AGENTS.md) and [`../AGENTS.md`](../AGENTS.md) to
   understand operational mode constraints.
3. **Align** changes with the CI workflows listed above to avoid drift.
4. **Use** `.github/scripts/` and templates as the default automation path.
5. **Log** every major decision to `hooks/audit.log`.
6. **Update** `agent-memory/` at session start and after each milestone.

## Spatial Contract

- **External Data Flow**: Must use **EPSG:4326** (WGS 84). Frontend sends `[lat, lng]`, Backend returns GeoJSON `[lng, lat]`.
- **Internal Analysis**: Use **EPSG:32734** (UTM 34S) for metric calculations (area, distance) within Cape Town.

## Workflow Commands

**Local Dev**:

```bash
# Backend
.venv/bin/uvicorn app.main:app --reload --port 8000
# Frontend
npm run dev
```

**Linting & Verification**:

```bash
# Frontend
npm run lint && npm run type-check && npm audit
# Backend
ruff check app/ && pip-audit -r requirements.txt --strict
```

**Data Refresh**:

```bash
python scripts/update_data.py
```

## Accessibility (WCAG 2.1 AA)

- All interactive elements must have `aria-label` and support keyboard navigation (tabindex, keydown).
- Ensure color contrast ratios > 4.5:1.

## Gotchas

1. **LatLng Order**: Leaflet expects `[lat, lng]`, but GeoJSON standard is `[lng, lat]`.
2. **CRS Mismatch**: Visual artifacts (e.g., map showing Antarctica) usually indicate EPSG:32734 coordinates passed to Leaflet expecting EPSG:4326.

## Validation Checklist (Agent-Run)

After every edit session the agent **must** run through this checklist:

- [ ] Relative links to `./README.AGENT_ACTIONS.md` and `./.github/` resolve.
- [ ] `bash .github/scripts/verify.sh` passes (infrastructure + lint + tests).
- [ ] `node .github/scripts/policy_check.js` passes (policies satisfied).
- [ ] No secrets introduced (`policies/no-secrets.yaml` rules honoured).
- [ ] PR template fields are populated for any auto-created PRs.
- [ ] CI workflows referenced in this file exist in `.github/workflows/`.
- [ ] `git diff --staged` shows only intended file(s) changed.
- [ ] `hooks/audit.log` updated with a summary of actions taken.

## Notes & Safety

- Always consult [`./README.AGENT_ACTIONS.md`](./README.AGENT_ACTIONS.md) for
  **final authority** on allowed actions.
- Reject or redact any secrets; report to `hooks/audit.log` if detected.
- If `SAFE_MODE=true`, do **not** perform large refactors — create a PR with
  proposed changes in `.github/patches/` instead.
- This file (`copilot-instructions.md`) is **quick guidance**; the documents
  listed in the "Primary References" table above are authoritative.
