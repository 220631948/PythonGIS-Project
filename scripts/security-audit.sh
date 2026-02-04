#!/bin/bash

# Security Audit Script for Cape Town GeoHub/n# Usage: ./scripts/security-audit.sh

echo "🔒 Starting Security Audit..."
FAIL=0

# 1. Secret Keys Check
echo "🔎 Checking for exposed API keys..."
if grep -r "API_KEY" . --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.git --exclude=*.md --exclude=*.sh --exclude=*.example | grep -v "os.getenv"; then
    echo "❌ FAIL: Potential API Key exposed in code!"
    FAIL=1
else
    echo "✅ PASS: No exposed API keys found."
fi

# 2. Hardcoded Secrets Check
echo "🔎 Checking for hardcoded database credentials..."
if grep -r "postgres://" . --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.git --exclude=*.md --exclude=*.sh --exclude=config.py; then
    echo "❌ FAIL: Hardcoded Postgres URI found!"
    FAIL=1
else
    echo "✅ PASS: No hardcoded database URIs found."
fi

# 3. PII Leakage Check (Safety Module)
echo "🔎 Checking Safety Analyzer for PII handling..."
if grep "drop(columns=cols_to_drop" app/spatial_analysis/safety.py > /dev/null; then
    echo "✅ PASS: PII columns are being dropped."
else
    echo "❌ FAIL: Safety Analyzer might be leaking PII (columns not dropped)."
    FAIL=1
fi

# 4. Git Hygiene Check
echo "🔎 Checking .gitignore for critical files..."
if grep ".env" .gitignore > /dev/null; then
    echo "✅ PASS: .env is ignored."
else
    echo "❌ FAIL: .env is NOT in .gitignore!"
    FAIL=1
fi

if grep "node_modules/" .gitignore > /dev/null; then
    echo "✅ PASS: node_modules is ignored."
else
    echo "❌ FAIL: node_modules is NOT in .gitignore!"
    FAIL=1
fi

echo "----------------------------------------"
if [ $FAIL -eq 0 ]; then
    echo "✅ SECURITY AUDIT PASSED"
    exit 0
else
    echo "❌ SECURITY AUDIT FAILED"
    exit 1
fi
