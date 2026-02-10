# Hooks System

This directory contains lifecycle hooks for SUPER-AGENT v3 that enforce safety constraints, validate inputs, and maintain audit trails.

## Hook Contract

All hooks must adhere to this contract:

- **Input**: JSON via stdin
- **Output**: JSON via stdout
- **Exit Codes**:
  - `0`: Allow / Modify (proceed with execution)
  - `1`: Error (halt with error)
  - `2`: Deny (block action)

## Available Hooks

### `BeforeAgent.js`
- **When**: Before agent initialization
- **Purpose**: Load memory, enrich context, prepare environment
- **Output**: Enriched context with project memory and agent manifest

### `BeforeTool.js`
- **When**: Before any tool execution
- **Purpose**: Validate tool inputs, enforce security rules, check permissions
- **Checks**:
  - Path traversal prevention
  - Write path restrictions (SAFE_MODE)
  - Shell command blacklist
  - Secret detection

### `AfterTool.js`
- **When**: After tool execution
- **Purpose**: Run tests, update memory, validate results
- **Actions**:
  - Run backend tests if `app/` or `tests/` modified
  - Run frontend lint if `frontend/` modified
  - Update project memory with results

### `BeforeFileWrite.js`
- **When**: Before writing any file
- **Purpose**: Validate file content, enforce schema, protect critical files
- **Checks**:
  - JSON/YAML syntax validation
  - Memory entry schema validation
  - Protected file warnings

### `AfterExecution.js`
- **When**: After agent execution completes
- **Purpose**: Archive logs, generate summary, list next steps
- **Output**: Execution summary with findings, artifacts, recommendations

## Audit Log

All hook decisions are logged to `audit.log` in JSONL format:

```json
{"hook_id":"BeforeTool","timestamp":"2026-02-10T12:00:00Z","tool_name":"workspace_file_ops","decision":"allow","violations":[]}
{"hook_id":"BeforeFileWrite","timestamp":"2026-02-10T12:01:00Z","file_path":".github/findings.json","decision":"allow","violations":[]}
```

## Security Rules

### Write Path Restrictions (SAFE_MODE)
- Only `.github/` writes allowed
- Attempts to write outside `.github/` are denied (exit code 2)
- Override requires explicit `SAFE_MODE=false` user confirmation

### Command Blacklist
- `rm -rf /`
- `sudo` (without justification)
- `ssh`, `scp` (raw, unapproved)
- `dd if=` (disk operations)

### Secret Detection
Scans content for patterns:
- `api_key`
- `password`
- `secret`
- `token`
- `dsn`

If detected, hook exits with code 2 and provides redaction guidance.

## Usage

Hooks are invoked automatically by the agent framework. For manual testing:

```bash
# Test BeforeTool hook
echo '{"tool_name":"workspace_file_ops","parameters":{"op":"write","file_path":"app/test.py"}}' | node .github/hooks/BeforeTool.js

# Expected: Exit code 2 (denied - outside .github/)

# Test with allowed path
echo '{"tool_name":"workspace_file_ops","parameters":{"op":"write","file_path":".github/test.md"}}' | node .github/hooks/BeforeTool.js

# Expected: Exit code 0 (allowed)
```

## Configuration

Hook behavior is configured via:
- `.github/agent-manifest.json` (safety constraints)
- `.github/policies/*.yaml` (policy rules)
- Environment variables (e.g., `SAFE_MODE=true`)

## Extending Hooks

To add a new hook:

1. Create `NewHook.js` following the contract
2. Add to `agent-manifest.json` hooks_registry
3. Test with mock inputs
4. Document in this README
