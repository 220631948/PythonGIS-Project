#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting Production Validation..."

# 1. Check Git Exceptions
echo "Checking git exclusions..."

check_ignore() {
    if git check-ignore -q "$1"; then
        echo -e "  $1: ${GREEN}OK${NC}"
    else
        echo -e "  $1: ${RED}FAIL${NC} - Not ignored"
        exit 1
    fi
}

check_ignore "postgres_data/"
check_ignore ".env"
check_ignore "node_modules/"

# 2. Verify Large Files in Git
echo -n "Checking for large files in git... "
if [ -z "$(find . -type f -size +50M -not -path '*/.git/*')" ]; then
     echo -e "${GREEN}PASS${NC}"
else
     echo -e "${RED}FAIL${NC} - Large files >50MB found"
     exit 1
fi

# 3. Docker Build Test
echo "Testing Docker builds..."
docker compose -f docker-compose.prod.yml config > /dev/null
if [ $? -eq 0 ]; then
    echo -e "Compose Config: ${GREEN}PASS${NC}"
else
    echo -e "Compose Config: ${RED}FAIL${NC}"
    exit 1
fi

# 4. Build Production Images
echo "Building production images (this may take a while)..."
docker compose -f docker-compose.prod.yml build

# 5. Start Production Stack
echo "Starting production stack..."
docker compose -f docker-compose.prod.yml up -d

echo "Waiting 30s for services to initialize..."
sleep 30

# 6. Health Checks
echo -n "Testing API Health... "
if curl -f -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
fi

echo -n "Testing Frontend Reachability... "
if curl -f -s http://localhost:80 > /dev/null; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
fi

# 7. Security Check (Basic)
echo -n "Checking for secrets in env... "
if grep -r "POSTGRES_PASSWORD=" .env | grep -v "POSTGRES_PASSWORD=$" > /dev/null; then
     echo -e "${GREEN}PASS${NC}"
else
     echo -e "${RED}WARN${NC} - POSTGRES_PASSWORD might be empty"
fi

# Cleanup
echo "Stopping production stack..."
docker compose -f docker-compose.prod.yml down

echo -e "${GREEN}Validation Complete!${NC}"
