#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="specify-check.log"
> "$LOG_FILE"

echo "Spec Kit - specify check" | tee -a "$LOG_FILE"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG_FILE"
echo "Working directory: $(pwd)" | tee -a "$LOG_FILE"
echo "Python: $(python --version 2>&1 || python3 --version 2>&1)" | tee -a "$LOG_FILE"

SPECIFY_STRICT=${SPECIFY_STRICT:-false}

run_specify_check() {
  echo "Running 'specify check'..." | tee -a "$LOG_FILE"
  if specify check >>"$LOG_FILE" 2>&1; then
    echo "specify check PASSED" | tee -a "$LOG_FILE"
    return 0
  else
    echo "specify check FAILED" | tee -a "$LOG_FILE"
    return 1
  fi
}

# If 'specify' is available, run it
if command -v specify >/dev/null 2>&1; then
  echo "specify found: $(specify --version 2>&1 || true)" | tee -a "$LOG_FILE"
  if run_specify_check; then
    exit 0
  else
    exit 1
  fi
fi

# Try to install specify in a venv
echo "specify CLI not found; attempting to install in a virtual environment" | tee -a "$LOG_FILE"
# Prefer python, fallback to python3
PY=python
if ! $PY -V >/dev/null 2>&1; then
  PY=python3
fi

# Create a venv in .spec-env (non-persistent )
$PY -m venv .spec-env 2>>"$LOG_FILE" || { echo "Failed to create venv" | tee -a "$LOG_FILE"; }
# shellcheck disable=SC1091
source .spec-env/bin/activate

python -m pip install --upgrade pip >>"$LOG_FILE" 2>&1 || true
if pip install --upgrade git+https://github.com/github/spec-kit.git >>"$LOG_FILE" 2>&1; then
  if command -v specify >/dev/null 2>&1; then
    echo "specify installed: $(specify --version 2>&1 || true)" | tee -a "$LOG_FILE"
    if run_specify_check; then
      exit 0
    else
      exit 1
    fi
  else
    echo "specify not found after install attempt; falling back to presence check" | tee -a "$LOG_FILE"
  fi
else
  echo "specify installation failed; falling back to presence check" | tee -a "$LOG_FILE"
fi

# Fallback: presence check of .specify
echo "Running presence check for .specify artifacts" | tee -a "$LOG_FILE"
if [ -d ".specify" ] && [ -f ".specify/spec.md" ] && [ -f ".specify/plan.md" ]; then
  echo "Presence check OK" | tee -a "$LOG_FILE"
  exit 0
else
  echo "Presence check FAILED: missing .specify artifacts" | tee -a "$LOG_FILE"
  ls -la .specify || true | tee -a "$LOG_FILE"
  if [ "$SPECIFY_STRICT" = "true" ]; then
    echo "SPECIFY_STRICT=true -> failing the check" | tee -a "$LOG_FILE"
    exit 1
  else
    echo "SPECIFY_STRICT is not enabled; failing the check to be safe" | tee -a "$LOG_FILE"
    exit 1
  fi
fi
