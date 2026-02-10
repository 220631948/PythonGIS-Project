#!/usr/bin/env bash
# Dependency Guardian - Main Scanner
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "🔍 Scanning dependencies..."

# NPM Audit
echo "📦 Frontend (npm)..."
npm audit --prefix "${REPO_ROOT}/frontend" --json > /tmp/npm-audit-$$.json || true

# Pip Audit
echo "🐍 Backend (pip)..."
pip-audit -r "${REPO_ROOT}/requirements.txt" --format json > /tmp/pip-audit-$$.json || true

# License Check (simple grep for now)
echo "⚖️  License compliance..."
# TODO: Implement license-checker integration

echo "✅ Scan complete!"
cat /tmp/npm-audit-$$.json /tmp/pip-audit-$$.json | jq -s '.'
