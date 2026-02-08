.PHONY: help install dev test lint format build clean docker-up docker-down docker-logs db-migrate db-upgrade

# Default target
help:
	@echo "Cape Town GeoHub - Development Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install      - Install all dependencies (frontend + backend)"
	@echo "  make setup        - Full setup: install deps, start DB, run migrations"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start both frontend and backend in development mode"
	@echo "  make dev-frontend - Start frontend dev server only"
	@echo "  make dev-backend  - Start backend dev server only"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests (backend + frontend)"
	@echo "  make test-backend - Run backend tests with coverage"
	@echo "  make test-frontend - Run frontend E2E tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint         - Run linters (ruff, eslint, type-check)"
	@echo "  make format       - Format all code (ruff, prettier)"
	@echo "  make type-check   - Run TypeScript type checking"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up    - Start all services with Docker Compose"
	@echo "  make docker-down  - Stop all Docker services"
	@echo "  make docker-logs  - View Docker service logs"
	@echo "  make docker-build - Rebuild Docker images"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate   - Generate new Alembic migration"
	@echo "  make db-upgrade   - Apply all pending migrations"
	@echo "  make db-reset     - Reset database (CAUTION: destroys data)"

# ============================================================================
# Setup & Installation
# ============================================================================

install:
	@echo "📦 Installing backend dependencies..."
	pip install -r requirements.txt
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ All dependencies installed!"

setup: install
	@echo "🐳 Starting database container..."
	docker compose up -d db
	@echo "⏳ Waiting for database to be ready..."
	sleep 10
	@echo "🔄 Running database migrations..."
	alembic upgrade head
	@echo "✅ Setup complete! Run 'make dev' to start development."

# ============================================================================
# Development
# ============================================================================

dev:
	@echo "🚀 Starting development servers..."
	@make -j2 dev-backend dev-frontend

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ============================================================================
# Testing
# ============================================================================

test: test-backend test-frontend
	@echo "✅ All tests passed!"

test-backend:
	@echo "🧪 Running backend tests..."
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing

test-frontend:
	@echo "🧪 Running frontend E2E tests..."
	cd frontend && npm run test

# ============================================================================
# Code Quality
# ============================================================================

lint:
	@echo "🔍 Running Python linter (ruff)..."
	ruff check app/ tests/
	@echo "🔍 Running frontend linter (eslint)..."
	cd frontend && npm run lint
	@echo "🔍 Running TypeScript type check..."
	cd frontend && npm run type-check
	@echo "✅ All lint checks passed!"

format:
	@echo "🎨 Formatting Python code..."
	ruff format app/ tests/
	ruff check --fix app/ tests/
	@echo "🎨 Formatting frontend code..."
	cd frontend && npx prettier --write 'src/**/*.{ts,tsx,css,json}'
	@echo "✅ All code formatted!"

type-check:
	cd frontend && npm run type-check

check-spec:
	@echo "Running Spec Kit verification (scripts/check_spec.sh)..."
	./scripts/check_spec.sh

# ============================================================================
# Docker
# ============================================================================

docker-up:
	docker compose up -d
	@echo "✅ Services started. View at http://localhost:3000"

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-build:
	docker compose up -d --build

# ============================================================================
# Database
# ============================================================================

db-migrate:
	@read -p "Enter migration message: " msg; \
	alembic revision --autogenerate -m "$$msg"

db-upgrade:
	alembic upgrade head

db-downgrade:
	alembic downgrade -1

db-reset:
	@echo "⚠️  WARNING: This will destroy all data in the database!"
	@read -p "Are you sure? [y/N] " confirm; \
	if [ "$$confirm" = "y" ]; then \
		docker compose down -v; \
		docker compose up -d db; \
		sleep 10; \
		alembic upgrade head; \
		echo "✅ Database reset complete!"; \
	fi

# ============================================================================
# Build & Deployment
# ============================================================================

build:
	@echo "🏗️  Building frontend for production..."
	cd frontend && npm run build
	@echo "✅ Build complete! Output in frontend/dist/"

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.vite
	rm -rf __pycache__
	rm -rf .pytest_cache
	rm -rf .ruff_cache
	rm -rf htmlcov
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Clean complete!"
