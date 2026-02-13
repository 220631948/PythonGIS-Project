# Test Case Matrix — Feature × Test Type Coverage

**Project:** Cape Town GeoHub Enterprise GIS Platform
**Version:** 1.0
**Target Coverage:** 80%+ across all test types
**Last Updated:** 2026-02-11

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Test implemented and passing |
| 🚧 | Test in progress |
| ⏳ | Test planned (not started) |
| ❌ | Test not applicable |
| ⚠️ | Test exists but failing |

---

## Coverage Matrix

| Feature / Module | Unit Tests | Integration Tests | E2E Tests | Security Tests | Performance Tests | Accessibility Tests |
|-----------------|------------|-------------------|-----------|----------------|-------------------|---------------------|
| **Authentication** |
| User Registration | ✅ | ✅ | ⏳ | ⏳ | ❌ | ❌ |
| User Login | ✅ | ✅ | ⏳ | ⏳ | ❌ | ❌ |
| JWT Token Issuance | ✅ | ✅ | ❌ | ⏳ | ❌ | ❌ |
| Token Refresh | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Token Revocation | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Logout Flow | ⏳ | ⏳ | ⏳ | ❌ | ❌ | ❌ |
| Password Hashing | ✅ | ✅ | ❌ | ⏳ | ❌ | ❌ |
| **RBAC & Authorization** |
| Role Assignment | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Permission Enforcement | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Super Admin Access | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Tenant Admin Access | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Editor Access | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Viewer Access | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| **Multi-Tenant Isolation** |
| Tenant Creation | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Tenant Context Middleware | ⏳ | ⏳ | ❌ | ⏳ | ❌ | ❌ |
| PostgreSQL RLS Policies | ⏳ | ⏳ | ❌ | ⏳ | ❌ | ❌ |
| Cross-Tenant Data Leakage | ❌ | ⏳ | ❌ | ⏳ | ❌ | ❌ |
| Tenant-Scoped Queries | ⏳ | ⏳ | ❌ | ⏳ | ⏳ | ❌ |
| **CSRF Protection** |
| CSRF Token Generation | ⏳ | ⏳ | ❌ | ⏳ | ❌ | ❌ |
| CSRF Validation (POST) | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| CSRF Validation (PUT) | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| CSRF Validation (DELETE) | ⏳ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| **Spatial Data API** |
| Create Spatial Data | ✅ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Read Spatial Data | ✅ | ✅ | ⏳ | ⏳ | ⏳ | ❌ |
| Update Spatial Data | ✅ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Delete Spatial Data | ✅ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Soft Delete Implementation | ⏳ | ⏳ | ❌ | ❌ | ❌ | ❌ |
| Pagination (List) | ✅ | ⏳ | ⏳ | ❌ | ⏳ | ❌ |
| Filtering (Bounding Box) | ✅ | ⏳ | ⏳ | ❌ | ⏳ | ❌ |
| **Spatial Analysis** |
| Buffer Operation | ✅ | ⏳ | ❌ | ⏳ | ⏳ | ❌ |
| Intersection Operation | ✅ | ⏳ | ❌ | ⏳ | ⏳ | ❌ |
| Union Operation | ✅ | ⏳ | ❌ | ⏳ | ⏳ | ❌ |
| Area Calculation | ✅ | ⏳ | ❌ | ❌ | ❌ | ❌ |
| Distance Calculation | ✅ | ⏳ | ❌ | ❌ | ❌ | ❌ |
| Site Suitability | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Clustering (K-means) | ✅ | ⏳ | ❌ | ❌ | ⏳ | ❌ |
| **Frontend Components** |
| Login Component | ⏳ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| Header Component | ✅ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| Sidebar Component | ✅ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| MapView Component | ⚠️ | ❌ | ⏳ | ❌ | ⏳ | ⏳ |
| HeatmapLayer Component | ✅ | ❌ | ⏳ | ❌ | ⏳ | ❌ |
| IssueReporter Component | ✅ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| Protected Routes | ⏳ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| Auth Context Provider | ⏳ | ❌ | ⏳ | ❌ | ❌ | ❌ |
| **Frontend Performance** |
| Virtual Scrolling (Layers) | ⏳ | ❌ | ⏳ | ❌ | ⏳ | ❌ |
| GeoJSON Clustering | ⏳ | ❌ | ⏳ | ❌ | ⏳ | ❌ |
| Progressive Tile Loading | ⏳ | ❌ | ⏳ | ❌ | ⏳ | ❌ |
| Service Worker Caching | ⏳ | ❌ | ⏳ | ❌ | ❌ | ❌ |
| Offline Data Sync | ⏳ | ❌ | ⏳ | ❌ | ❌ | ❌ |
| **Accessibility** |
| Keyboard Navigation | ⏳ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| Screen Reader Support | ⏳ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| WCAG 2.1 AA Compliance | ⏳ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| High Contrast Mode | ⏳ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| Focus Indicators | ⏳ | ❌ | ⏳ | ❌ | ❌ | ⏳ |
| **Database & Migrations** |
| Alembic Upgrade | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Alembic Downgrade | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Migration Reversibility | ❌ | ⏳ | ❌ | ❌ | ❌ | ❌ |
| GIST Indexes (Spatial) | ❌ | ⏳ | ❌ | ❌ | ⏳ | ❌ |
| Composite Indexes | ❌ | ⏳ | ❌ | ❌ | ⏳ | ❌ |
| Foreign Key Constraints | ❌ | ⏳ | ❌ | ❌ | ❌ | ❌ |
| **Security Vulnerabilities** |
| SQL Injection (Spatial) | ❌ | ⏳ | ❌ | ⏳ | ❌ | ❌ |
| XSS (Frontend) | ❌ | ❌ | ⏳ | ⏳ | ❌ | ❌ |
| CSRF Bypass | ❌ | ⏳ | ❌ | ⏳ | ❌ | ❌ |
| Broken Authentication | ❌ | ⏳ | ⏳ | ⏳ | ❌ | ❌ |
| Insecure Direct Object Ref | ❌ | ⏳ | ❌ | ⏳ | ❌ | ❌ |
| Sensitive Data Exposure | ❌ | ⏳ | ❌ | ⏳ | ❌ | ❌ |
| **Infrastructure** |
| Docker Compose Up | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Health Check Endpoints | ❌ | ⏳ | ⏳ | ❌ | ❌ | ❌ |
| Environment Validation | ⏳ | ⏳ | ❌ | ❌ | ❌ | ❌ |
| Database Connectivity | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Redis Connectivity | ❌ | ⏳ | ❌ | ❌ | ❌ | ❌ |

---

## Summary Statistics

### Current Coverage (As of 2026-02-11)

| Test Type | Implemented | In Progress | Planned | Total | Coverage % |
|-----------|-------------|-------------|---------|-------|------------|
| **Unit Tests** | 23 | 1 | 18 | 42 | 54.8% |
| **Integration Tests** | 9 | 0 | 32 | 41 | 22.0% |
| **E2E Tests** | 0 | 0 | 35 | 35 | 0.0% |
| **Security Tests** | 0 | 0 | 27 | 27 | 0.0% |
| **Performance Tests** | 0 | 0 | 13 | 13 | 0.0% |
| **Accessibility Tests** | 0 | 0 | 11 | 11 | 0.0% |
| **TOTAL** | 32 | 1 | 136 | 169 | 18.9% |

### Target Coverage (End of Sprint 4)

| Test Type | Target |
|-----------|--------|
| **Unit Tests** | 90%+ (38/42 features) |
| **Integration Tests** | 85%+ (35/41 features) |
| **E2E Tests** | 70%+ (25/35 critical flows) |
| **Security Tests** | 100% (27/27 OWASP checks) |
| **Performance Tests** | 80%+ (10/13 benchmarks) |
| **Accessibility Tests** | 100% (11/11 WCAG checks) |
| **TOTAL** | 80%+ (135/169 test cases) |

---

## Priority Test Cases (Sprint 1-2)

### Critical (Must Complete in Sprint 1)
1. ✅ **Auth: User Registration** (Unit + Integration)
2. ✅ **Auth: User Login** (Unit + Integration)
3. ⏳ **Auth: Token Refresh** (Unit + Integration + Security)
4. ⏳ **Auth: Token Revocation** (Unit + Integration + Security)
5. ⏳ **CSRF: Token Validation** (Integration + Security)
6. ⏳ **Multi-Tenant: RLS Policies** (Integration + Security)
7. ⏳ **Multi-Tenant: Cross-Tenant Leakage** (Integration + Security)
8. ⏳ **RBAC: Permission Enforcement** (Unit + Integration + Security)

### High Priority (Sprint 2)
9. ⏳ **Frontend: Login Component** (Unit + E2E + Accessibility)
10. ⏳ **Frontend: Protected Routes** (E2E)
11. ⏳ **Spatial Data: CRUD Operations** (Integration + Security)
12. ⏳ **Security: SQL Injection Tests** (Security)
13. ⏳ **Performance: Spatial Query 100k Features** (Performance)
14. ⏳ **Accessibility: WCAG 2.1 AA Compliance** (Accessibility)

---

## Test Execution Plan

### Sprint 1 (Weeks 1-2)
**Focus:** Backend security, auth flows, multi-tenant isolation

```bash
# Unit tests
pytest tests/test_auth_flow.py -v --cov=app/api/auth_api --cov=app/core/security

# Integration tests
pytest tests/test_tenant_isolation.py -v --cov=app/middleware/tenant_context

# Security tests
pytest tests/test_security.py::test_csrf_required -v
pytest tests/test_security.py::test_cross_tenant_leakage -v
```

**Expected Output:** 20+ tests passing, 60%+ backend coverage

---

### Sprint 2 (Weeks 3-4)
**Focus:** RBAC, TypeScript fixes, spatial queries

```bash
# Backend unit tests
pytest tests/test_rbac.py -v --cov=app/core/rbac

# Frontend unit tests
cd frontend && npm run test:unit -- --coverage

# Integration tests (spatial)
pytest tests/test_spatial_analysis.py -v --cov=app/api/spatial_tools_api
```

**Expected Output:** 35+ tests passing, 70%+ backend coverage, 50%+ frontend coverage

---

### Sprint 3 (Weeks 5-6)
**Focus:** E2E tests, frontend components, accessibility

```bash
# Frontend component tests
cd frontend && npm run test:unit -- --run

# E2E tests
cd frontend && npm run test:e2e

# Accessibility tests
cd frontend && npx playwright test tests/accessibility.spec.js
```

**Expected Output:** 15+ E2E tests passing, WCAG AA compliance on critical flows

---

### Sprint 4 (Weeks 7-8)
**Focus:** Security scanning, performance benchmarks, production readiness

```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.geohub.capetown

# Load testing
locust -f tests/performance/locustfile.py \
  --users 1000 --spawn-rate 10 --host https://staging.geohub.capetown

# Full test suite
pytest --cov=app --cov-report=html
cd frontend && npm run test:unit && npm run test:e2e
```

**Expected Output:** Zero high/critical vulnerabilities, p95 < 500ms, 80%+ total coverage

---

## Test Case Details

### Example: Authentication Flow (Unit Test)

**File:** `tests/test_auth_flow.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestAuthFlow:
    def test_register_user_success(self):
        """Register new user with valid data"""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "tenant_id": 1
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_register_user_duplicate_email(self):
        """Reject duplicate email registration"""
        # First registration
        client.post("/api/auth/register", json={
            "email": "duplicate@example.com",
            "password": "SecurePassword123!",
            "tenant_id": 1
        })
        # Duplicate registration
        response = client.post("/api/auth/register", json={
            "email": "duplicate@example.com",
            "password": "AnotherPassword456!",
            "tenant_id": 1
        })
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_login_with_valid_credentials(self):
        """Login with correct email/password"""
        # Register user first
        client.post("/api/auth/register", json={
            "email": "login@example.com",
            "password": "SecurePassword123!",
            "tenant_id": 1
        })
        # Login
        response = client.post("/api/auth/login", json={
            "email": "login@example.com",
            "password": "SecurePassword123!"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login_with_invalid_password(self):
        """Reject login with wrong password"""
        response = client.post("/api/auth/login", json={
            "email": "login@example.com",
            "password": "WrongPassword!"
        })
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
```

---

### Example: Cross-Tenant Data Leakage (Security Test)

**File:** `tests/test_security.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestMultiTenantSecurity:
    def test_cross_tenant_data_leakage(self):
        """Verify users cannot access data from other tenants"""
        # Register Tenant A user
        response_a = client.post("/api/auth/register", json={
            "email": "user_a@tenant_a.com",
            "password": "Password123!",
            "tenant_id": 1
        })
        token_a = response_a.json()["access_token"]

        # Register Tenant B user
        response_b = client.post("/api/auth/register", json={
            "email": "user_b@tenant_b.com",
            "password": "Password123!",
            "tenant_id": 2
        })
        token_b = response_b.json()["access_token"]

        # Tenant A creates spatial data
        client.post(
            "/api/spatial_data",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"geom": {"type": "Point", "coordinates": [18.4, -33.9]}}
        )

        # Tenant B tries to access Tenant A data (should be empty)
        response = client.get(
            "/api/spatial_data",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert response.status_code == 200
        assert len(response.json()["data"]) == 0  # No cross-tenant data

    def test_tenant_admin_cannot_manage_other_tenants_users(self):
        """Verify tenant_admin cannot see users from other tenants"""
        # Login as Tenant A admin
        response = client.post("/api/auth/login", json={
            "email": "admin_a@tenant_a.com",
            "password": "AdminPass123!"
        })
        token = response.json()["access_token"]

        # Try to list all users (should only see Tenant A users)
        response = client.get(
            "/api/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        users = response.json()["data"]
        for user in users:
            assert user["tenant_id"] == 1  # Tenant A only
```

---

## Continuous Integration

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: kartoza/postgis:15-3.4
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest --cov=app --cov-report=xml --cov-report=term
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gis_test
          SECRET_KEY: test_secret_key_32_characters_long
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
        working-directory: frontend
      - run: npm run test:unit -- --coverage
        working-directory: frontend
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        working-directory: frontend
```

---

**Status:** Living Document
**Next Review:** End of Sprint 1 (2026-02-24)
**Owner:** QA Lead + Tech Lead
