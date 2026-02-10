#!/usr/bin/env bash
# UI Crawler - Basic route discovery
set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"

echo "🕷️  Crawling UI at ${BASE_URL}..."

# Simple curl-based check (Playwright would be better)
if curl -s "${BASE_URL}" > /dev/null; then
  echo "  ✓ Base URL accessible"
else
  echo "  ❌ Base URL not accessible"
  exit 1
fi

echo "✅ Crawl complete (basic check only - integrate Playwright for full crawling)"
