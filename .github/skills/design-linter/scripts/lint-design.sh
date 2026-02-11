#!/usr/bin/env bash
# Design Linter - Scan for hardcoded styles
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
FRONTEND_DIR="${REPO_ROOT}/frontend/src"

echo "🎨 Scanning for design violations..."

# Find hardcoded hex colors
echo "  Searching for hardcoded colors..."
grep -rn '#[0-9a-fA-F]\{6\}' "${FRONTEND_DIR}" --include="*.tsx" --include="*.css" || echo "  No hardcoded colors found"

echo "✅ Design lint complete!"
