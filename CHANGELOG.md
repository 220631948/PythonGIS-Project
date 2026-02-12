# Changelog

All notable changes to the Cape Town GeoHub project are documented in this file.

## [2.1.0] - 2026-02-12 - Sprint 4: QA, Security & CI/CD

### Added - Production Readiness 🚀

#### **S4.1: Test Coverage (80%+ Target)**
- **Backend Unit Tests**:
  - Enhanced auth flow tests (`test_auth_flow.py`): Added login validation, token refresh, logout, unauthorized access, and invalid token tests
  - Tenant isolation integration tests (`test_tenant_isolation.py`): 230+ lines covering RLS policies, cross-tenant data leakage prevention, and super admin access
  - Spatial query PostGIS tests (`test_spatial_queries.py`): 350+ lines testing point-in-polygon, buffer operations, distance calculations, bounding box queries, geometry validation
  - SQL injection security tests (`test_security_sql_injection.py`): 300+ lines covering layer name validation, attribute sanitization, DOS prevention, and complex injection attempts

- **Frontend Component Tests**:
  - ClusterLayer component tests (`ClusterLayer.test.tsx`): Tests cluster rendering, marker interactions, radius/color calculations, and PostGIS integration
  - Login component tests (`Login.test.tsx`): Comprehensive tests for form validation, accessibility (WCAG 2.1 AA), password visibility, error handling, keyboard navigation
  - usePostGISClusters hook tests (`usePostGISClusters.test.ts`): Tests API integration, request cancellation, error handling, zoom threshold logic

#### **S4.2: OWASP Top 10 Security Scanning**
- **OWASP ZAP Configuration**:
  - ZAP baseline scan workflow integrated into CI/CD pipeline
  - Custom rules file (`.zap/rules.tsv`) with severity-based alerts for XSS, SQL injection, code injection, authentication issues
  - Automated security scanning on push/PR and weekly schedule

#### **S4.3: CI/CD Pipeline for Staging**
- **Lint & Type Check Workflow** (`.github/workflows/lint-and-typecheck.yml`):
  - Backend: Black, Flake8, MyPy
  - Frontend: ESLint, TypeScript compiler, Prettier
  - Triggers on push/PR to main/master/develop branches

- **Test Suite Workflow** (`.github/workflows/test-suite.yml`):
  - Backend pytest with coverage reporting (80% threshold enforcement)
  - Frontend Vitest unit tests with coverage
  - E2E Playwright tests against live server
  - Codecov integration for coverage tracking

- **Security Audit Workflow** (`.github/workflows/security-audit.yml`):
  - OWASP ZAP baseline scan against running backend
  - Backend dependency scanning (Safety)
  - Frontend dependency scanning (npm audit)
  - Python security linting (Bandit)
  - Secret scanning (Gitleaks)
  - SQL injection test execution

- **Staging Deployment Workflow** (`.github/workflows/deploy-staging.yml`):
  - Pre-deployment lint and test validation
  - Docker image build and push to GHCR
  - Database migration with Alembic
  - SSH deployment to staging server
  - Health checks and smoke tests
  - Automated rollback on failure
  - Slack/Discord notification support

#### **S4.4: Blue-Green Production Deployment**
- **Production Deployment Workflow** (`.github/workflows/deploy-production.yml`):
  - Automatic determination of target environment (blue/green)
  - Comprehensive pre-deployment validation (tests, security, staging health)
  - Production-optimized Docker image builds with Sentry DSN
  - Database backup before migrations
  - Blue-green deployment with zero-downtime traffic switching
  - Post-deployment monitoring (5-minute error rate tracking)
  - Automated rollback on failure with traffic switch reversion
  - Deployment record tracking via API

#### **S4.5: Production Monitoring with Sentry**
- **Enhanced Sentry Integration** (`app/utils/sentry_utils.py`):
  - `track_query_performance()`: Database query performance monitoring with slow query alerts (>5s threshold)
  - `track_security_event()`: Security event tracking with severity-based alerting (info/warning/error/critical)
  - `monitor_db_query()`: Decorator for automatic query performance tracking
  - `capture_validation_error()`: Validation error tracking for attack attempt detection
  - `capture_rate_limit_exceeded()`: Rate limit violation tracking
  - `capture_authentication_failure()`: Authentication failure tracking with hashed email for privacy
  - `capture_authorization_failure()`: Authorization violation tracking
  - `capture_tenant_isolation_violation()`: Critical tenant isolation breach detection
  - `capture_sql_injection_attempt()`: SQL injection attempt tracking with payload truncation

### Changed
- pytest configuration (`pytest.ini`): Added `asyncio` marker for async test support
- Sentry initialization (`app/sentry_.py`): Enhanced with SQLAlchemy and Starlette integrations, PII scrubbing, coordinate sanitization

### Infrastructure
- **GitHub Actions Workflows**: 5 new CI/CD workflows
- **Docker**: Production and staging image builds with multi-stage optimization
- **Database**: Automated backup and migration system with rollback support
- **Monitoring**: Comprehensive Sentry integration with geographic context, query performance, and security event tracking

### Security
- **OWASP ZAP**: Baseline security scanning integrated into CI/CD
- **Dependency Scanning**: Automated vulnerability scanning for Python (Safety) and Node.js (npm audit)
- **Static Analysis**: Bandit security linting for Python
- **Secret Scanning**: Gitleaks integration to prevent credential leaks
- **SQL Injection Prevention**: Comprehensive test coverage and validation utilities
- **Tenant Isolation**: RLS policy enforcement with automated violation detection

### Testing
- **Coverage Threshold**: 80% minimum enforced in CI/CD pipeline
- **Test Frameworks**: pytest (backend), Vitest (frontend), Playwright (E2E)
- **Test Files**: 7 new test files (4 backend, 3 frontend) with 1000+ lines of test coverage
- **Continuous Testing**: Automated test execution on every push/PR

### Deployment
- **Blue-Green Strategy**: Zero-downtime production deployments with automatic rollback
- **Database Migrations**: Automated with pre-deployment backup and post-migration verification
- **Health Checks**: Multi-level health validation (backend, frontend, database, system resources)
- **Smoke Tests**: Automated post-deployment validation with Playwright
- **Rollback**: Automatic rollback on deployment or smoke test failure

**Sprint 4 Completion**: All 5 stories (S4.1-S4.5) completed with 100% acceptance criteria met. Enterprise GIS platform is now production-ready with comprehensive testing, security scanning, and automated deployment pipelines.

## [2.0.0] - 2026-02-10

### Added - Major Platform Evolution 🚀

This release represents a transformative upgrade with 15 major new features, adding 67 new API endpoints across 14 new modules.

#### High Priority Features

- **3D Visualization & Terrain Analysis**: Building extrusion, elevation profiles, shadow analysis, viewshed, terrain tiles
- **AI-Powered Insights**: Traffic/crime prediction, land use change detection, natural language queries
- **Community Engagement**: Public feedback, issue reporting with photos, polling/voting, data contributions
- **Smart Notifications & Alerts**: Location-based subscriptions, push notifications, alert management, location watching

#### Analytics & Workflow Features

- **Advanced Demographics**: Population density heatmaps, socioeconomic indicators, age distribution
- **Environmental Impact**: Flood risk modeling, air quality monitoring, green space accessibility, climate resilience
- **Custom Dashboard Builder**: Drag-and-drop widgets, templates, chart/map/metric components
- **Comparative Analysis**: Neighborhood comparisons, temporal analysis, benchmarking, similar area finder
- **Project Workspaces**: Multi-scenario management, team collaboration, version tracking
- **Automated Reports**: PDF/DOCX generation, scheduled delivery, templates
- **Data Quality Dashboard**: Quality metrics, validation errors, data lineage, freshness indicators
- **Advanced Search**: Spatial query builder, cross-dataset search, saved searches, recommendations

#### Technical Features

- **Performance Optimization**: Vector tiles (MVT), clustering, level-of-detail, cache management
- **Mobile App**: React Native foundation, offline maps, GPS tracking, data collection
- **API Marketplace**: Extension system, API key management, webhooks, developer portal

**New Dependencies**: scikit-learn, scipy, pytz, pillow, reportlab, weasyprint, redis, celery, python-jose

**See NEW_FEATURES_2026.md for complete documentation**

## [1.1.0] - 2026-01-19

### Added
- **Collaborative Spatial Review Tools**: New API and frontend panel for location-based comments, annotations, and threaded discussions.
- **Data Export & Reporting**: Support for GeoJSON, CSV, XLSX, and KML exports via new `export_api` and `ExportPanel`.
- **Field Data Support**: Mobile-optimized forms for data capture with offline sync capabilities and photo upload support.
- **Advanced Spatial Analysis**: Added Viewshed analysis, Topology validation, and Network routing (isochrones).
- **Metadata Catalog**: Searchable spatial metadata catalog with dataset discovery and attribute filtering.
- **Real-Time Data Integration**: Support for live feeds (traffic, weather, service disruptions) with auto-refresh and timestamps.
- **UX Enhancements**: 
  - Shareable map state via URL persistence.
  - Tabbed Sidebar interface for easier feature navigation.
  - Improved Header with quick actions for Export, Dashboard, and Offline Data.
  - Keyboard shortcuts for power users.
- **Comprehensive E2E Testing**: 45 new automated tests covering all advanced feature integrations.

### Fixed
- **Frontend Refactoring**: Fixed critical syntax errors and extensive code duplication in `App.jsx` and `Header.jsx`.
- **MapView Integration**: Fixed missing props and broken logic for route rendering and active filtering.
- **API Registry**: Ensured all 6 new advanced feature routers are correctly registered in `main.py`.

## [1.0.1] - 2026-01-19

### Fixed

#### Backend (Python/FastAPI)
- **Deprecated FastAPI Event Handler**: Replaced deprecated `@app.on_event("startup")` with modern `lifespan` context manager pattern for handling application startup/shutdown events
- **Exception Handler Response**: Fixed `geohub_exception_handler` to return proper `JSONResponse` with HTTP status codes instead of plain dictionaries
- **Import Order (PEP8)**: Moved `import json` from bottom of `data_loader.py` to the top with other imports, following Python best practices
- **Unused Imports**: Removed unused imports across multiple files:
  - `data_loader.py`: Removed unused `os`, `Path`, `Optional`, `Any`, `shape`, `InvalidGeometryError`
  - `exceptions.py`: Removed unused `HTTPException`, `status`
  - `transport.py`: Removed unused `List` from typing imports
  - `main.py`: Removed unused `os` import from health check function
- **GIS Distance Calculation**: Fixed warning in `transport.py` where distance calculation was incorrectly using geographic CRS. Removed redundant degree-distance calculation line that was superseded by projected CRS calculation

#### Frontend (React/Vite)
- **Vite Dev Server Proxy**: Added API proxy configuration to `vite.config.js` to forward `/api` requests to backend during development
- **React Hooks Order**: Fixed hook ordering in `useOfflineData.js` where `processQueue` was accessed before declaration
- **React useEffect Best Practices**: Refactored `useUserPreferences` hook to avoid calling setState directly within useEffect, using proper initialization pattern instead
- **Unused Import**: Removed unused `useEffect` import from `useUrlState.js`
- **Switch Statement Default Case**: Added default case to switch statement in `useActionQueue`

#### Configuration & Dependencies
- **requirements.txt**: Added missing `pydantic-settings` package (required by `config.py`), added `pytest` and `httpx` for testing
- **Dockerfile**: Replaced template "hello world" Dockerfile with proper Python/FastAPI configuration including:
  - Multi-stage build for smaller image
  - GIS library dependencies (GDAL, GEOS, PROJ)
  - Non-privileged user for security
  - Health check configuration
  - Proper volume mounts for data persistence
- **compose.yaml**: Updated Docker Compose configuration with:
  - Port exposure (8000:8000)
  - Environment variables
  - Volume mounts for persistent data
  - Health check configuration

### Added

#### Test Suite
- **test_spatial_utils.py**: New comprehensive tests for spatial utility functions:
  - Point-in-polygon checks
  - Buffer creation with CRS handling
  - Distance calculations
  - Geometry simplification
- **test_endpoints.py**: New API endpoint tests covering:
  - Health, config, and stats endpoints
  - Services, transport, environment endpoints
  - Spatial tools (buffer, point-in-polygon)
  - Safety, land use, utilities endpoints
  - Infrastructure and portal endpoints
  - Static file and cache endpoints
- **test_config.py**: New configuration tests covering:
  - Application settings validation
  - Logging configuration
  - Data URL validation
  - Cache and server settings

### Improved

- **Code Documentation**: Added descriptive comments throughout modified code
- **Type Safety**: Improved type hints in exception handling
- **Error Messages**: More descriptive error responses from exception handler

## [1.0.0] - Initial Release

- Initial release of Cape Town GeoHub
- FastAPI backend with GIS analysis capabilities
- React frontend with Leaflet mapping
- Integration with City of Cape Town Open Data Portal
- PWA support for offline functionality

## [Unreleased] - 2026-02-11 (Swarm Release Candidate)
### Added
- **Zero-Trust Auth**: Multi-tenant login system (JWT, Models, API).
- **Frontend Auth**: Login page and Header integration.
- **Schema**: Tenant-aware spatial models.
- **Infra**: Stabilized dev environment (fallback mode).
- **Fixes**: Resolved 3D Visualization API import error.
- **Fixes**: Resolved Tailwind CSS build error.

## [Unreleased] - 2026-02-11 (Phase F QA Update)
### Fixed
- **Database**: Resolved test runtime issues by implementing SQLite fallback for auth tests.
- **Tests**: Fixed 'no such table' errors in auth flow tests by ensuring correct model registration.
### Verified
- **Auth**: Login, Register, and Me endpoints passed verification.
- **Frontend**: Build verified successfully.
