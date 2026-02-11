---
name: refactor-strategist
description: Safe automated refactoring with rollback scripts and migration plans
metadata:
  version: 0.1.0
  required_tools: ["workspace_file_ops", "test_runner", "git_history_analysis"]
  safety_constraints:
    ["patches-only-in-safe-mode", "tests-required", "rollback-mandatory"]
---

# Refactor Strategist Skill

## Purpose

Orchestrates safe code refactoring:

- Detect refactoring opportunities (duplicated code, large functions, etc.)
- Generate refactoring patches
- Create rollback scripts
- Validate with tests before/after
- Split large refactors into sequenced PRs

## Usage

```bash
agent invoke refactor-strategist --analyze-code
agent invoke refactor-strategist --propose-refactor --target app/api/
agent invoke refactor-strategist --execute-refactor --patch-id REF-001
```

## Refactoring Types

1. **Extract Function**: Extract repeated logic into reusable functions
2. **Extract Module**: Split large modules into smaller, focused ones
3. **Rename**: Safe rename with all references updated
4. **Move**: Relocate functions/classes with import updates
5. **Type Strengthen**: Add type hints to untyped code

## Safety Protocol (SAFE_MODE=true)

1. Analyze code and identify refactoring opportunity
2. Generate patch under `.github/patches/REF-<id>.patch`
3. Create rollback script `.github/patches/REF-<id>-rollback.sh`
4. Run tests against patched version (dry-run)
5. Create draft PR with migration plan
6. Never auto-apply (require manual review)

## Output

```json
{
  "refactor_id": "REF-001",
  "type": "extract-function",
  "description": "Extract spatial buffer logic into utility function",
  "files_affected": ["app/spatial_analysis/services_analyzer.py"],
  "patch_path": ".github/patches/REF-001.patch",
  "rollback_path": ".github/patches/REF-001-rollback.sh",
  "tests_pass": true,
  "risk_level": "low"
}
```

## Integration

- Uses `ruff` for Python refactoring suggestions
- Uses TypeScript language server for TS/JS refactoring
- Integrates with PR reviewer skill for post-refactor validation
