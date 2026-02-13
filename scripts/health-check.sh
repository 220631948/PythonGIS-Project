#!/usr/bin/env bash
#
# Health Check Script for Cape Town GeoHub
# Verifies all critical services are running and accessible
#
# Usage:
#   ./scripts/health-check.sh                 # Check all services
#   ./scripts/health-check.sh --service db    # Check specific service
#   ./scripts/health-check.sh --ci            # CI mode (strict, exits on first failure)
#
# Exit Codes:
#   0 - All health checks passed
#   1 - One or more health checks failed
#   2 - Invalid arguments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8000}"
DB_HOST="${POSTGRES_SERVER:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-geohub}"
DB_NAME="${POSTGRES_DB:-geohub_db}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

MAX_RETRIES=10
RETRY_DELAY=3
CI_MODE=false
CHECK_SERVICE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --ci)
            CI_MODE=true
            shift
            ;;
        --service)
            CHECK_SERVICE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--ci] [--service db|api|frontend|redis]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 2
            ;;
    esac
done

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Health check functions
check_database() {
    log_info "Checking PostgreSQL database..."

    if command -v pg_isready &> /dev/null; then
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
            log_success "Database is ready (pg_isready)"

            # Test actual connection if psql is available
            if command -v psql &> /dev/null; then
                if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT PostGIS_version();" &> /dev/null; then
                    log_success "PostGIS extension verified"
                else
                    log_warning "Connected to database but PostGIS query failed"
                fi
            fi
            return 0
        else
            log_error "Database is not ready"
            return 1
        fi
    else
        log_warning "pg_isready not found, skipping database check"
        return 0
    fi
}

check_api() {
    log_info "Checking API server..."

    for i in $(seq 1 $MAX_RETRIES); do
        if curl -f -s -o /dev/null "$BASE_URL/health"; then
            log_success "API health endpoint responding"

            # Check API version endpoint
            if api_version=$(curl -s "$BASE_URL/api/version" 2>/dev/null); then
                log_info "API Version: $(echo "$api_version" | jq -r '.version' 2>/dev/null || echo 'unknown')"
            fi

            return 0
        else
            if [ $i -lt $MAX_RETRIES ]; then
                log_warning "API not ready, retrying ($i/$MAX_RETRIES)..."
                sleep $RETRY_DELAY
            fi
        fi
    done

    log_error "API health check failed after $MAX_RETRIES attempts"
    return 1
}

check_frontend() {
    log_info "Checking frontend server..."

    if curl -f -s -o /dev/null "$FRONTEND_URL"; then
        log_success "Frontend is accessible"
        return 0
    else
        log_error "Frontend is not accessible at $FRONTEND_URL"
        return 1
    fi
}

check_redis() {
    log_info "Checking Redis cache..."

    if command -v redis-cli &> /dev/null; then
        if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null; then
            log_success "Redis is responding"
            return 0
        else
            log_warning "Redis is not responding (optional service)"
            return 0  # Don't fail on Redis (optional)
        fi
    else
        log_warning "redis-cli not found, skipping Redis check"
        return 0
    fi
}

# Main health check orchestration
main() {
    local failed=0

    echo "=========================================="
    echo "  Cape Town GeoHub - Health Check"
    echo "=========================================="
    echo ""

    # Check specific service or all
    if [ -n "$CHECK_SERVICE" ]; then
        case $CHECK_SERVICE in
            db|database)
                check_database || failed=$((failed + 1))
                ;;
            api|backend)
                check_api || failed=$((failed + 1))
                ;;
            frontend|ui)
                check_frontend || failed=$((failed + 1))
                ;;
            redis|cache)
                check_redis || failed=$((failed + 1))
                ;;
            *)
                log_error "Unknown service: $CHECK_SERVICE"
                exit 2
                ;;
        esac
    else
        # Check all services
        check_database || failed=$((failed + 1))
        echo ""

        check_api || failed=$((failed + 1))
        echo ""

        check_frontend || failed=$((failed + 1))
        echo ""

        check_redis || failed=$((failed + 1))
        echo ""
    fi

    echo "=========================================="

    if [ $failed -eq 0 ]; then
        log_success "All health checks passed ✓"
        exit 0
    else
        log_error "$failed health check(s) failed"
        exit 1
    fi
}

# Run main function
main
