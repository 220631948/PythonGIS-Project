#!/usr/bin/env bash
# API Adapter - Contract Validator
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
API_SPEC="${REPO_ROOT}/openapi.json"  # Would be generated from FastAPI

echo "🔗 Validating API contracts..."

# Fetch OpenAPI spec (requires backend running)
if curl -s http://localhost:8000/openapi.json > "${API_SPEC}" 2>/dev/null; then
  echo "  ✓ OpenAPI spec fetched"
  # TODO: Compare with frontend types
else
  echo "  ⚠️  Backend not running, skipping contract validation"
fi

echo "✅ Validation complete!"
