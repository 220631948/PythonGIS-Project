#!/usr/bin/env bash
# Accessibility Auditor - Axe-core Runner
set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"

echo "♿ Running accessibility audit on ${BASE_URL}..."

# Check if Playwright is available
if command -v npx &> /dev/null; then
  echo "  Using Playwright + axe-core..."
  # TODO: Implement Playwright script with axe-core
  # npx playwright test --grep @a11y
  echo "  ⚠️  Placeholder: Integrate Playwright + axe-core script"
else
  echo "  ❌ Playwright not available"
  exit 1
fi

echo "✅ Audit complete!"
