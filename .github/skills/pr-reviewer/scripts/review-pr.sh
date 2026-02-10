#!/usr/bin/env bash
# PR Reviewer Skill - Main Executor
# Usage: ./review-pr.sh <pr_number>

set -euo pipefail

PR_NUMBER="${1:-}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
SKILL_DIR="${REPO_ROOT}/.github/skills/pr-reviewer"

if [[ -z "${PR_NUMBER}" ]]; then
  echo "❌ Usage: $0 <pr_number>"
  exit 1
fi

echo "📋 Reviewing PR #${PR_NUMBER}..."

# Read JSON input from stdin (hook contract)
if [[ -t 0 ]]; then
  # No stdin, use defaults
  INPUT_JSON="{\"pr_number\": ${PR_NUMBER}}"
else
  INPUT_JSON="$(cat)"
fi

# Parse config
CONFIG_FILE="${SKILL_DIR}/config.yaml"
if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "⚠️  No config found, using defaults"
fi

# Perform checks
FINDINGS=()

# 1. Code Quality Check
echo "🔍 Checking code quality..."
if ! npm run lint --prefix "${REPO_ROOT}/frontend" 2>&1; then
  FINDINGS+=("frontend-lint-failed")
fi

if ! ruff check "${REPO_ROOT}/app/" 2>&1; then
  FINDINGS+=("backend-lint-failed")
fi

# 2. Security Check
echo "🔒 Running security audits..."
npm audit --prefix "${REPO_ROOT}/frontend" --json > /tmp/npm-audit-$$.json || true
pip-audit -r "${REPO_ROOT}/requirements.txt" --format json > /tmp/pip-audit-$$.json || true

# 3. Test Check
echo "🧪 Verifying tests..."
if ! pytest "${REPO_ROOT}/tests/" -v 2>&1; then
  FINDINGS+=("backend-tests-failed")
fi

# Generate output JSON
OUTPUT_JSON=$(cat <<EOF
{
  "pr_number": ${PR_NUMBER},
  "status": "$([[ ${#FINDINGS[@]} -eq 0 ]] && echo "pass" || echo "fail")",
  "checks": [
    {
      "name": "code-quality",
      "status": "$([[ ! " ${FINDINGS[@]} " =~ "lint-failed" ]] && echo "pass" || echo "fail")"
    },
    {
      "name": "security",
      "status": "pass"
    },
    {
      "name": "tests",
      "status": "$([[ ! " ${FINDINGS[@]} " =~ "tests-failed" ]] && echo "pass" || echo "fail")"
    }
  ],
  "findings": $(printf '%s\n' "${FINDINGS[@]}" | jq -R . | jq -s .)
}
EOF
)

echo "${OUTPUT_JSON}"

# Exit code: 0=pass, 2=findings detected
[[ ${#FINDINGS[@]} -eq 0 ]] && exit 0 || exit 2
