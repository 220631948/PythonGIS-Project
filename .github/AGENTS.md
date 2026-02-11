# AGENTS.md - Autonomous Agent Guidelines for Cape Town GeoHub

This file is the authoritative guide for AI Agents operating in autonomous mode.

## 1. Operational Modes

- **SAFE_MODE** (Default): The Agent acts as an observer and proposer. It cannot directly modify application source code (`src/` or `app/`).
- **FULL_ACCESS**: Only enabled upon explicit user confirmation. Allows direct writes to all files.

## 2. File System Constraints (SAFE_MODE)

- **Allowed Writes**: The Agent must ONLY write to the `.github/` directory.
  - Allowed: `.github/patches/`, `.github/findings.json`, `.github/hooks/audit.log`.
- **Code Modifications**: Any desired changes to `src/` (Frontend) or `app/` (Backend) must be proposed via a **patch file** created in `.github/patches/<timestamp>_description.patch`.

## 3. Audit & Memory

- **Audit Logging**: Every major decision or action must be logged to `.github/hooks/audit.log`.
- **Project Memory**: Read and write persistent context (architectural decisions, progress tracking) to `.github/agent-memory/project_memory.json`. Do not rely on chat history alone.

## 4. Testing Strategy

- **Backend**: Generate tests using `pytest` in the `tests/` directory.
- **Frontend**: Generate unit tests using `Vitest` and E2E tests using `Playwright`.
- **Snapshots**: Enforce the creation of snapshot tests for any new UI components to prevent regression.

## 5. Review Protocol

Before confirming a task as complete, the Agent must run and pass the following checks:

1. **Backend**: `ruff check app/`
2. **Frontend**: `npm run lint`

*Failure to comply with these protocols will result in rejected actions.*
