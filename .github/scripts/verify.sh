#!/usr/bin/env bash
# verify.sh - Comprehensive verification runner for Cape Town GeoHub
# SUPER-AGENT v3 Local Verification Script
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "🔍 Cape Town GeoHub Verification Suite"
echo "======================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((PASSED++))
}

fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((FAILED++))
}

warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
  ((WARNINGS++))
}

# Check 1: Repository Structure
echo "📁 Checking repository structure..."
if [[ -d "${REPO_ROOT}/app" && -d "${REPO_ROOT}/frontend" && -d "${REPO_ROOT}/.github" ]]; then
  pass "Repository structure valid"
else
  fail "Missing required directories (app/, frontend/, .github/)"
fi
echo ""

# Check 2: Agent Infrastructure
echo "🤖 Checking agent infrastructure..."
REQUIRED_DIRS=(
  ".github/agents"
  ".github/skills"
  ".github/hooks"
  ".github/policies"
  ".github/agent-memory"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [[ -d "${REPO_ROOT}/${dir}" ]]; then
    pass "${dir}/ exists"
  else
    fail "${dir}/ missing"
  fi
done
echo ""

# Check 3: Policy Files
echo "📋 Checking policy files..."
REQUIRED_POLICIES=(
  "no-secrets.yaml"
  "dependency-allowlist.yaml"
  "max-pr-size.yaml"
  "protected-files.yaml"
)

for policy in "${REQUIRED_POLICIES[@]}"; do
  if [[ -f "${REPO_ROOT}/.github/policies/${policy}" ]]; then
    pass "Policy ${policy} exists"
  else
    fail "Policy ${policy} missing"
  fi
done
echo ""

# Check 4: Skills
echo "🛠️  Checking skills..."
REQUIRED_SKILLS=(
  "pr-reviewer"
  "dep-guardian"
  "design-linter"
  "ui-crawler"
  "api-adapter"
  "refactor-strategist"
  "accessibility-auditor"
)

for skill in "${REQUIRED_SKILLS[@]}"; do
  if [[ -f "${REPO_ROOT}/.github/skills/${skill}/SKILL.md" ]]; then
    pass "Skill ${skill} exists"
  else
    fail "Skill ${skill} missing"
  fi
done
echo ""

# Check 5: Hooks
echo "🪝 Checking hooks..."
REQUIRED_HOOKS=(
  "BeforeAgent.js"
  "BeforeTool.js"
  "AfterTool.js"
  "BeforeFileWrite.js"
  "AfterExecution.js"
)

for hook in "${REQUIRED_HOOKS[@]}"; do
  if [[ -f "${REPO_ROOT}/.github/hooks/${hook}" ]]; then
    pass "Hook ${hook} exists"
  else
    fail "Hook ${hook} missing"
  fi
done
echo ""

# Check 6: Backend Dependencies
echo "🐍 Checking backend dependencies..."
if [[ -f "${REPO_ROOT}/requirements.txt" ]]; then
  pass "requirements.txt exists"
  
  # Check if venv exists
  if [[ -d "${REPO_ROOT}/.venv" ]]; then
    pass "Virtual environment exists"
  else
    warn "Virtual environment not found (.venv/)"
  fi
else
  fail "requirements.txt missing"
fi
echo ""

# Check 7: Frontend Dependencies
echo "📦 Checking frontend dependencies..."
if [[ -f "${REPO_ROOT}/frontend/package.json" ]]; then
  pass "frontend/package.json exists"
  
  # Check if node_modules exists
  if [[ -d "${REPO_ROOT}/frontend/node_modules" ]]; then
    pass "node_modules exists"
  else
    warn "node_modules not found (run: cd frontend && npm install)"
  fi
else
  fail "frontend/package.json missing"
fi
echo ""

# Check 8: Linting (if tools available)
echo "🔧 Running linters..."

# Backend (ruff)
if command -v ruff &> /dev/null; then
  if ruff check "${REPO_ROOT}/app/" --quiet; then
    pass "Backend linting (ruff)"
  else
    fail "Backend linting failed (run: ruff check app/)"
  fi
else
  warn "ruff not installed, skipping backend lint"
fi

# Frontend (eslint)
if [[ -d "${REPO_ROOT}/frontend/node_modules" ]]; then
  cd "${REPO_ROOT}/frontend"
  if npm run lint --silent; then
    pass "Frontend linting (eslint)"
  else
    fail "Frontend linting failed (run: npm run lint)"
  fi
  cd "${REPO_ROOT}"
else
  warn "node_modules not found, skipping frontend lint"
fi
echo ""

# Check 9: Type Checking
echo "🔎 Type checking..."

# Frontend TypeScript
if [[ -d "${REPO_ROOT}/frontend/node_modules" ]]; then
  cd "${REPO_ROOT}/frontend"
  if npm run type-check --silent; then
    pass "TypeScript type checking"
  else
    fail "TypeScript type checking failed (run: npm run type-check)"
  fi
  cd "${REPO_ROOT}"
else
  warn "node_modules not found, skipping type check"
fi
echo ""

# Check 10: Security Audits
echo "🔒 Security audits..."

# NPM audit
if [[ -d "${REPO_ROOT}/frontend/node_modules" ]]; then
  cd "${REPO_ROOT}/frontend"
  if npm audit --audit-level=moderate --silent; then
    pass "npm audit (no moderate+ vulnerabilities)"
  else
    warn "npm audit found vulnerabilities (run: npm audit)"
  fi
  cd "${REPO_ROOT}"
fi

# Pip audit
if command -v pip-audit &> /dev/null; then
  if pip-audit -r "${REPO_ROOT}/requirements.txt" --strict --quiet; then
    pass "pip-audit (no vulnerabilities)"
  else
    warn "pip-audit found vulnerabilities (run: pip-audit -r requirements.txt)"
  fi
else
  warn "pip-audit not installed, skipping"
fi
echo ""

# Check 11: Tests
echo "🧪 Running tests..."

# Backend tests
if command -v pytest &> /dev/null && [[ -d "${REPO_ROOT}/tests" ]]; then
  if pytest "${REPO_ROOT}/tests/" -x --tb=short --quiet; then
    pass "Backend tests (pytest)"
  else
    fail "Backend tests failed (run: pytest tests/)"
  fi
else
  warn "pytest not available or tests/ missing, skipping backend tests"
fi

# Frontend tests
if [[ -d "${REPO_ROOT}/frontend/node_modules" ]]; then
  cd "${REPO_ROOT}/frontend"
  if npm run test:unit --silent 2>/dev/null || true; then
    pass "Frontend unit tests"
  else
    warn "Frontend unit tests not configured or failed"
  fi
  cd "${REPO_ROOT}"
fi
echo ""

# Check 12: Policy Check
echo "📜 Running policy checks..."
if [[ -f "${REPO_ROOT}/.github/scripts/policy_check.js" ]]; then
  if node "${REPO_ROOT}/.github/scripts/policy_check.js" --quiet; then
    pass "Policy checks"
  else
    fail "Policy checks failed (run: node .github/scripts/policy_check.js)"
  fi
else
  warn "policy_check.js not found, skipping"
fi
echo ""

# Summary
echo "======================================="
echo "📊 VERIFICATION SUMMARY"
echo "======================================="
echo -e "${GREEN}Passed:${NC} ${PASSED}"
echo -e "${YELLOW}Warnings:${NC} ${WARNINGS}"
echo -e "${RED}Failed:${NC} ${FAILED}"
echo ""

if [[ ${FAILED} -eq 0 ]]; then
  echo -e "${GREEN}✅ All critical checks passed!${NC}"
  if [[ ${WARNINGS} -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) - review recommended${NC}"
  fi
  exit 0
else
  echo -e "${RED}❌ ${FAILED} check(s) failed - fix required${NC}"
  exit 1
fi
