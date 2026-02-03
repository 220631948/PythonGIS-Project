#!/bin/bash
# Cape Town GeoHub - Offline Persistence Verification Script
# Tests that data survives container restarts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="compose.yaml"
POSTGRES_DATA_DIR="./postgres_data"
DB_CONTAINER="geohub_postgis"
DB_USER="geohub"
DB_NAME="geohub_db"
TEST_TABLE="offline_test"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Cape Town GeoHub - Offline Verification${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Function to check if docker compose is available
check_docker() {
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        echo -e "${RED}Error: docker-compose or docker compose not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}Using: $DOCKER_COMPOSE${NC}"
}

# Function to wait for database
wait_for_db() {
    echo "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $DB_CONTAINER pg_isready -U $DB_USER -d $DB_NAME &> /dev/null; then
            echo -e "${GREEN}Database is ready!${NC}"
            return 0
        fi
        echo "  Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}Database did not become ready in time${NC}"
    return 1
}

# Function to run SQL
run_sql() {
    docker exec -e PGPASSWORD=geohub_password $DB_CONTAINER psql -h localhost -U $DB_USER -d $DB_NAME -t -c "$1"
}

# Step 1: Check docker compose
echo -e "\n${YELLOW}Step 1: Checking Docker environment${NC}"
check_docker

# Step 2: Stop any running containers
echo -e "\n${YELLOW}Step 2: Stopping existing containers${NC}"
$DOCKER_COMPOSE -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
echo -e "${GREEN}Containers stopped${NC}"

# Step 3: Check if postgres_data exists from previous run
echo -e "\n${YELLOW}Step 3: Checking for existing data${NC}"
if [ -d "$POSTGRES_DATA_DIR" ] && [ "$(ls -A $POSTGRES_DATA_DIR 2>/dev/null)" ]; then
    echo -e "${GREEN}Found existing postgres_data directory with files${NC}"
    EXISTING_DATA=true
else
    echo "No existing data found - this will be a fresh start"
    EXISTING_DATA=false
fi

# Step 4: Start containers
echo -e "\n${YELLOW}Step 4: Starting containers${NC}"
$DOCKER_COMPOSE -f $COMPOSE_FILE up -d

# Step 5: Wait for database
echo -e "\n${YELLOW}Step 5: Waiting for database${NC}"
sleep 10  # Initial wait for container startup
wait_for_db

# Step 6: Insert test data
echo -e "\n${YELLOW}Step 6: Creating test data${NC}"
run_sql "CREATE TABLE IF NOT EXISTS $TEST_TABLE (id SERIAL PRIMARY KEY, value TEXT, created_at TIMESTAMP DEFAULT NOW());"
TIMESTAMP=$(date +%s)
run_sql "INSERT INTO $TEST_TABLE (value) VALUES ('test_$TIMESTAMP');"
echo -e "${GREEN}Inserted test record with timestamp: $TIMESTAMP${NC}"

# Step 7: Verify PostGIS
echo -e "\n${YELLOW}Step 7: Verifying PostGIS${NC}"
POSTGIS_VERSION=$(run_sql "SELECT PostGIS_Version();" | tr -d ' ')
if [ -n "$POSTGIS_VERSION" ]; then
    echo -e "${GREEN}PostGIS version: $POSTGIS_VERSION${NC}"
else
    echo -e "${RED}PostGIS not available!${NC}"
    exit 1
fi

# Step 8: Get current record count
INITIAL_COUNT=$(run_sql "SELECT COUNT(*) FROM $TEST_TABLE;" | tr -d ' ')
echo -e "\n${YELLOW}Step 8: Current record count: $INITIAL_COUNT${NC}"

# Step 9: Stop containers
echo -e "\n${YELLOW}Step 9: Stopping containers to test persistence${NC}"
$DOCKER_COMPOSE -f $COMPOSE_FILE down
sleep 5

# Step 10: Verify data directory exists
echo -e "\n${YELLOW}Step 10: Checking data persistence${NC}"
if [ -d "$POSTGRES_DATA_DIR" ] && [ "$(ls -A $POSTGRES_DATA_DIR)" ]; then
    echo -e "${GREEN}postgres_data directory preserved with $(ls $POSTGRES_DATA_DIR | wc -l | tr -d ' ') items${NC}"
else
    echo -e "${RED}ERROR: postgres_data directory is empty or missing!${NC}"
    exit 1
fi

# Step 11: Restart containers
echo -e "\n${YELLOW}Step 11: Restarting containers${NC}"
$DOCKER_COMPOSE -f $COMPOSE_FILE up -d
sleep 10
wait_for_db

# Step 12: Verify data survived restart
echo -e "\n${YELLOW}Step 12: Verifying data survived restart${NC}"
FINAL_COUNT=$(run_sql "SELECT COUNT(*) FROM $TEST_TABLE;" | tr -d ' ')
echo "Record count after restart: $FINAL_COUNT"

if [ "$FINAL_COUNT" -ge "$INITIAL_COUNT" ]; then
    echo -e "${GREEN}✓ SUCCESS: Data persisted across restart!${NC}"
    echo -e "${GREEN}✓ Offline-first infrastructure is working correctly${NC}"
else
    echo -e "${RED}✗ FAILURE: Data was lost!${NC}"
    echo -e "${RED}Expected at least $INITIAL_COUNT records, found $FINAL_COUNT${NC}"
    exit 1
fi

# Step 13: Final summary
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${GREEN}VERIFICATION COMPLETE - ALL TESTS PASSED${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Summary:"
echo "  - PostGIS version: $POSTGIS_VERSION"
echo "  - Records persisted: $FINAL_COUNT"
echo "  - Data directory: $POSTGRES_DATA_DIR"
echo ""
echo -e "${GREEN}Your offline-first infrastructure is ready!${NC}"

exit 0
