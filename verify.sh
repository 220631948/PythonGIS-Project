#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "== Verify: Cape Town GeoHub - Local Verification Script =="

error_count=0
failed_steps=()

function run_step() {
  local desc="$1"; shift
  echo "\n--- $desc ---"
  if ! "$@"; then
    echo "[FAIL] $desc"
    error_count=$((error_count+1))
    failed_steps+=("$desc")
  else
    echo "[OK] $desc"
  fi
}

# ---------------------
# Backend checks
# ---------------------
run_step "Python - check runtime" python --version
run_step "Ruff linter" .venv/bin/ruff check app/ || true

# Run (non-destructive) tests - may fail if PostGIS not available
run_step "Pytest (fast)" .venv/bin/python -m pytest tests/test_utils/test_config.py -q || true

# ---------------------
# Frontend checks
# ---------------------
if [ -d "frontend" ]; then
  pushd frontend >/dev/null
  echo "Running npm ci (frontend) — may take a while"
  run_step "npm ci (frontend)" npm ci || true
  run_step "TypeScript type-check" npx tsc --noEmit || true
  run_step "ESLint" npm run lint || true
  run_step "Unit tests (Vitest)" npm run test:unit || true
  popd >/dev/null
else
  echo "No frontend/ directory found — skipping frontend checks"
fi

# ---------------------
# Security & Policy checks
# ---------------------
# Check for obvious hardcoded secrets (quick regex scan)
echo "\n--- Quick secret scan (regex) ---"
secret_hits=$(git grep -I -n -E "(api[_-]?key|apikey|secret|token|password|private_key)" || true)
if [ -n "$secret_hits" ]; then
  echo "Potential secrets found (grep):"
  echo "$secret_hits"
  error_count=$((error_count+1))
  failed_steps+=("secret-scan")
else
  echo "No obvious secrets found by grep"
fi

# Run policy-as-code checks (if Node + yaml installed)
echo "\n--- Policy-as-Code checks ---"
if command -v node >/dev/null 2>&1; then
  if node -e "require('yaml')" >/dev/null 2>&1; then
    if ! node .github/scripts/policy_check.js --quiet; then
      echo "Policy checks failed"
      error_count=$((error_count+1))
      failed_steps+=("policy-check")
    fi
  else
    echo "yaml package not found for policy_check.js; install with 'npm install -g yaml' or 'npm install yaml'"
    echo "Skipping policy checks (limited functionality)"
  fi
else
  echo "Node.js not found; skipping policy checks"
fi

# ---------------------
# Findings summary
# ---------------------
echo "\n== Summary =="
echo "Errors / failed steps: $error_count"
if [ ${#failed_steps[@]} -gt 0 ]; then
  echo "Failed steps:"; for s in "${failed_steps[@]}"; do echo " - $s"; done
fi

echo "Verify script completed. For full CI, run workflows from .github/workflows/ci.yml"

# Exit non-zero if any failures
if [ "$error_count" -gt 0 ]; then
  exit 2
fi

exit 0
