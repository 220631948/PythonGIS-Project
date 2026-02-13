# Enterprise GIS Platform — Complete Execution Plan
## Cape Town GeoHub: Phase B-G Implementation Roadmap

**Version:** 2.0
**Last Updated:** 2026-02-11
**Status:** Phase A Complete ✅ | Phase B-G Planned 📋
**Project:** Enterprise Multi-Tenant Spatial Data Platform
**Tech Stack:** FastAPI + PostGIS + React 19 + TypeScript + Docker

---

## Executive Summary

This execution plan provides a comprehensive roadmap for transforming the Cape Town GeoHub from a beta prototype into a production-ready, enterprise-grade multi-tenant GIS platform. Phase A (Discovery) identified 100+ files, 30+ API endpoints, and critical security gaps. This plan addresses infrastructure stabilization, security hardening, multi-tenant architecture, UX modernization, automated QA, and CI/CD deployment across **7 phases** over **8-12 weeks**.

### Critical Metrics (Current State)
- ✅ **Backend:** 30+ FastAPI endpoints, 18 PostGIS spatial models, JWT auth (incomplete)
- ⚠️ **Security:** SECRET_KEY hardcoded, no RBAC/CSRF, tenant isolation missing
- ⚠️ **Testing:** 157 backend tests (partial DB failures), 18 TypeScript errors blocking CI
- ⚠️ **Infrastructure:** Docker unstable, no CI/CD, dependencies incomplete

### Success Criteria (Target State)
- 🎯 **Security:** Zero hardcoded secrets, full RBAC, tenant RLS enforcement, CSRF protection
- 🎯 **Quality:** 80%+ test coverage, zero critical vulnerabilities, WCAG 2.1 AA compliance
- 🎯 **Performance:** API p95 < 500ms, 100k+ spatial features < 1s, 1000 concurrent users
- 🎯 **DevOps:** Automated deployments, zero-downtime, 99.9% uptime SLA

---

## 1. Project Objectives & Scope

### 1.1 Strategic Goals

#### Primary Objectives
1. **Security Hardening:** Eliminate all critical vulnerabilities (SECRET_KEY, CSRF, SQL injection risks)
2. **Multi-Tenant Architecture:** Implement row-level security (RLS) and tenant isolation at database level
3. **Production Readiness:** Achieve enterprise-grade reliability, monitoring, and deployment automation
4. **User Experience:** Modernize frontend with accessibility (WCAG 2.1 AA), performance optimization, and offline resilience

#### Secondary Objectives
1. **Technical Debt Resolution:** Fix 18 TypeScript errors, complete placeholder TODOs in site suitability module
2. **Documentation:** Comprehensive API docs, deployment guides, runbooks
3. **Developer Experience:** Pre-commit hooks, linting automation, local dev environment stability

### 1.2 Scope Boundaries

#### In Scope
- ✅ Backend security (auth, RBAC, CSRF, secrets management)
- ✅ Database multi-tenant schema with RLS policies
- ✅ Frontend auth integration, performance optimization, accessibility
- ✅ Automated testing (unit, integration, E2E, security)
- ✅ CI/CD pipeline (GitHub Actions → staging/production)
- ✅ Infrastructure stabilization (Docker, PostGIS, Redis, Celery)

#### Out of Scope
- ❌ New feature development (beyond completing auth/tenant architecture)
- ❌ Mobile native apps (PWA capabilities are in scope)
- ❌ AI/ML model training (inference endpoints are in scope)
- ❌ Third-party integrations (beyond existing City of Cape Town data sources)

### 1.3 Key Deliverables

| Deliverable | Description | Phase | Format |
|------------|-------------|-------|--------|
| **Security Audit Report** | SECRET_KEY fix, CSRF implementation, RBAC design | C | Markdown |
| **Multi-Tenant Schema** | Tenants table, RLS policies, migration scripts | C, D | SQL + Alembic |
| **Auth Flow (Frontend)** | Login, Register, Protected Routes, Token Refresh | E | React Components |
| **Test Suite** | 80%+ coverage (unit + integration + E2E) | F | Pytest + Vitest + Playwright |
| **CI/CD Pipeline** | Lint, test, security scan, deploy automation | G | GitHub Actions |
| **Production Deployment** | Blue-green deployment, rollback procedures | G | Docker Compose + Nginx |
| **Documentation** | API docs (OpenAPI), deployment guide, runbooks | All | Markdown + Swagger UI |

### 1.4 Success Metrics

#### Security Metrics
- ✅ Zero hardcoded secrets in codebase
- ✅ All auth endpoints protected with CSRF tokens
- ✅ Tenant data isolation enforced via PostgreSQL RLS
- ✅ JWT tokens revocable within 5 minutes (blacklist table)
- ✅ Zero critical/high vulnerabilities (pip-audit + npm audit)

#### Quality Metrics
- ✅ 80%+ test coverage (backend + frontend combined)
- ✅ All TypeScript strict mode enabled, zero type errors
- ✅ All linters passing (ruff + eslint) in CI
- ✅ WCAG 2.1 AA compliance (axe-core validation)
- ✅ Lighthouse score ≥ 90 (performance, accessibility, SEO)

#### Performance Metrics
- ✅ API p95 response time < 500ms (spatial queries)
- ✅ Frontend initial load < 3s (FCP), < 5s (TTI)
- ✅ Spatial queries on 100k+ features < 1s
- ✅ Support 1000 concurrent users (load testing)

#### DevOps Metrics
- ✅ Automated deployments to staging (merge to `develop`)
- ✅ Zero-downtime deployments (blue-green strategy)
- ✅ Rollback time < 5 minutes (health check failures)
- ✅ 99.9% uptime SLA (monitored via Sentry APM)

---

## 2. Work Breakdown Structure (WBS)

### 2.1 Phase Hierarchy

```mermaid
graph TD
    A[Phase A: Discovery ✅] --> B[Phase B: Infrastructure Stabilization]
    B --> C[Phase C: Security & Multi-Tenant Auth]
    C --> D[Phase D: Backend & Database Hardening]
    D --> E[Phase E: Frontend UX & GIS Modernization]
    E --> F[Phase F: QA Verification & Automation]
    F --> G[Phase G: Continuous Deployment]

    B --> B1[Docker Health]
    B --> B2[Env Reproducibility]
    B --> B3[Dependency Management]
    B --> B4[Database Migrations]

    C --> C1[Secret Management]
    C --> C2[JWT Hardening]
    C --> C3[CSRF Protection]
    C --> C4[Multi-Tenant RBAC]

    D --> D1[Type Safety]
    D --> D2[API Hardening]
    D --> D3[Spatial Indexing]
    D --> D4[Data Integrity]

    E --> E1[Auth Integration]
    E --> E2[Performance Optimization]
    E --> E3[Accessibility]
    E --> E4[Offline Resilience]

    F --> F1[Backend Tests]
    F --> F2[Frontend Tests]
    F --> F3[Security Tests]
    F --> F4[Performance Benchmarks]

    G --> G1[CI/CD Pipeline]
    G --> G2[Deployment Strategy]
    G --> G3[Monitoring & Alerting]
```

### 2.2 Task Breakdown by Phase

#### Phase B: Infrastructure Stabilization (5 days)

| ID | Task | Priority | Effort | Owner | Dependencies |
|----|------|----------|--------|-------|--------------|
| B.1 | Fix Docker Compose permissions (PostGIS volume) | Critical | 1d | DevOps | - |
| B.2 | Create health check scripts (db, api, frontend) | High | 0.5d | DevOps | B.1 |
| B.3 | Install missing dependencies (email-validator, passlib) | Critical | 0.5d | Backend | - |
| B.4 | Run pip-audit + npm audit security scans | High | 0.5d | Security | B.3 |
| B.5 | Pin all dependencies with versions | Medium | 1d | Backend/Frontend | B.3 |
| B.6 | Review Alembic migration status | High | 0.5d | Backend | B.1 |
| B.7 | Create migration for missing tenants table | High | 1d | Backend | B.6 |
| B.8 | Add indexes for tenant_id foreign keys | Medium | 0.5d | Backend | B.7 |

**Total Effort:** 5.5 days
**Critical Path:** B.1 → B.6 → B.7 → B.8

---

#### Phase C: Security & Multi-Tenant Auth (8 days)

| ID | Task | Priority | Effort | Owner | Dependencies |
|----|------|----------|--------|-------|--------------|
| **C.1: Secret Management** |
| C.1.1 | Move SECRET_KEY to .env variable | Critical | 0.5d | Backend | - |
| C.1.2 | Generate secure random SECRET_KEY (32+ chars) | Critical | 0.25d | Backend | C.1.1 |
| C.1.3 | Add SECRET_KEY validation on startup | High | 0.5d | Backend | C.1.2 |
| C.1.4 | Document key rotation process | Medium | 0.5d | DevOps | C.1.2 |
| **C.2: JWT Token Hardening** |
| C.2.1 | Add token refresh endpoint | High | 1d | Backend | C.1.3 |
| C.2.2 | Implement token revocation (blacklist table) | High | 1.5d | Backend | C.2.1 |
| C.2.3 | Set secure cookie options (httpOnly, sameSite) | High | 0.5d | Backend | C.2.1 |
| **C.3: CSRF Protection** |
| C.3.1 | Add FastAPI CSRF middleware | Critical | 1d | Backend | - |
| C.3.2 | Generate CSRF tokens for frontend | High | 0.5d | Backend | C.3.1 |
| C.3.3 | Validate CSRF on POST/PUT/DELETE | High | 0.5d | Backend | C.3.2 |
| **C.4: Multi-Tenant RBAC** |
| C.4.1 | Define roles (super_admin, tenant_admin, editor, viewer) | High | 0.5d | Backend | - |
| C.4.2 | Create permission matrix (CRUD per resource) | High | 1d | Backend | C.4.1 |
| C.4.3 | Implement role-based decorators for endpoints | High | 1.5d | Backend | C.4.2 |
| C.4.4 | Add tenant context middleware | High | 1d | Backend | C.4.3 |

**Total Effort:** 10.25 days → **8 days** (parallelization)
**Critical Path:** C.1.1 → C.1.2 → C.1.3 → C.2.1 → C.2.2

---

#### Phase D: Backend & Database Hardening (6 days)

| ID | Task | Priority | Effort | Owner | Dependencies |
|----|------|----------|--------|-------|--------------|
| **D.1: Type Safety & Linting** |
| D.1.1 | Fix TypeScript errors (18 errors in DataStatusPanel, MapView, etc.) | Critical | 2d | Frontend | - |
| D.1.2 | Enable strict mode in tsconfig.json | High | 0.5d | Frontend | D.1.1 |
| D.1.3 | Fix ruff unused import (advanced_analysis_api.py) | Medium | 0.25d | Backend | - |
| **D.2: API Hardening** |
| D.2.1 | Add input validation for all spatial endpoints | High | 1.5d | Backend | - |
| D.2.2 | Implement rate limiting per tenant | High | 1d | Backend | C.4.4 |
| D.2.3 | Add pagination metadata to all list endpoints | Medium | 1d | Backend | - |
| **D.3: Spatial Indexing** |
| D.3.1 | Verify GIST indexes on all geometry columns | High | 0.5d | Backend | B.7 |
| D.3.2 | Add composite indexes (tenant_id + geom) | High | 1d | Backend | D.3.1 |
| D.3.3 | Analyze query performance with EXPLAIN | Medium | 0.5d | Backend | D.3.2 |
| **D.4: Data Integrity** |
| D.4.1 | Implement PostgreSQL RLS policies (tenant isolation) | Critical | 2d | Backend | B.7, C.4.4 |
| D.4.2 | Add soft deletes with deleted_at column | Medium | 1d | Backend | - |
| D.4.3 | Create audit log table | Medium | 1d | Backend | - |

**Total Effort:** 12.25 days → **6 days** (parallelization)
**Critical Path:** D.1.1 → D.1.2 ; D.4.1 (most critical)

---

#### Phase E: Frontend UX & GIS Modernization (7 days)

| ID | Task | Priority | Effort | Owner | Dependencies |
|----|------|----------|--------|-------|--------------|
| **E.1: Auth Integration** |
| E.1.1 | Complete Login component integration | High | 1d | Frontend | C.2.1 |
| E.1.2 | Add auth context provider (React Context API) | High | 1d | Frontend | E.1.1 |
| E.1.3 | Implement protected routes (react-router-dom) | High | 0.5d | Frontend | E.1.2 |
| E.1.4 | Add token refresh logic (auto-refresh before expiry) | High | 1d | Frontend | C.2.1, E.1.2 |
| **E.2: Performance Optimization** |
| E.2.1 | Implement virtual scrolling for large layer lists | Medium | 1d | Frontend | - |
| E.2.2 | Optimize GeoJSON rendering with clustering | High | 1.5d | Frontend | - |
| E.2.3 | Add progressive loading for tile layers | Medium | 1d | Frontend | - |
| **E.3: Accessibility** |
| E.3.1 | Complete WCAG 2.1 AA compliance (axe-core scan) | High | 1.5d | Frontend | - |
| E.3.2 | Add keyboard navigation for all features | High | 1d | Frontend | - |
| E.3.3 | Implement screen reader announcements | Medium | 0.5d | Frontend | - |
| **E.4: Offline Resilience** |
| E.4.1 | Enhance service worker caching strategy | Medium | 1d | Frontend | - |
| E.4.2 | Add background sync for offline edits | Low | 1d | Frontend | E.4.1 |

**Total Effort:** 12 days → **7 days** (parallelization)
**Critical Path:** E.1.1 → E.1.2 → E.1.3 → E.1.4

---

#### Phase F: QA Verification & Automation (5 days)

| ID | Task | Priority | Effort | Owner | Dependencies |
|----|------|----------|--------|-------|--------------|
| **F.1: Backend Tests** |
| F.1.1 | Unit tests for all auth flows (register, login, me, refresh) | Critical | 1.5d | Backend | C.2.2 |
| F.1.2 | Integration tests for tenant isolation | Critical | 1.5d | Backend | D.4.1 |
| F.1.3 | Spatial query tests with PostGIS assertions | High | 1d | Backend | D.3.2 |
| **F.2: Frontend Tests** |
| F.2.1 | Vitest unit tests for components | High | 1d | Frontend | - |
| F.2.2 | Playwright E2E for critical user flows | Critical | 2d | Frontend | E.1.3 |
| F.2.3 | Accessibility tests with axe-core | High | 0.5d | Frontend | E.3.1 |
| **F.3: Security Tests** |
| F.3.1 | OWASP Top 10 vulnerability scanning (ZAP) | High | 1d | Security | - |
| F.3.2 | SQL injection tests for spatial queries | High | 1d | Security | D.2.1 |
| F.3.3 | Cross-tenant data leakage tests | Critical | 1d | Security | D.4.1 |
| **F.4: Performance Benchmarks** |
| F.4.1 | Load testing (1000 concurrent users via Locust) | High | 1d | DevOps | - |
| F.4.2 | Spatial query performance (100k+ features) | High | 0.5d | Backend | D.3.3 |

**Total Effort:** 12 days → **5 days** (parallelization, automated tools)
**Critical Path:** F.1.2 → F.3.3 (tenant isolation verification)

---

#### Phase G: Continuous Deployment (4 days)

| ID | Task | Priority | Effort | Owner | Dependencies |
|----|------|----------|--------|-------|--------------|
| **G.1: CI/CD Pipeline** |
| G.1.1 | Lint & type check (Python + TypeScript) workflow | Critical | 0.5d | DevOps | D.1.2 |
| G.1.2 | Run test suite (backend + frontend) workflow | Critical | 0.5d | DevOps | F.2.2 |
| G.1.3 | Security audit (pip-audit, npm audit) workflow | High | 0.5d | DevOps | B.4 |
| G.1.4 | Build Docker images workflow | High | 0.5d | DevOps | B.1 |
| G.1.5 | Deploy to staging on merge to `develop` | High | 1d | DevOps | G.1.1-4 |
| G.1.6 | Deploy to production on tag | High | 1d | DevOps | G.1.5 |
| **G.2: Deployment Strategy** |
| G.2.1 | Blue-green deployment with health checks | High | 1d | DevOps | G.1.6 |
| G.2.2 | Database migration automation | High | 0.5d | Backend | B.6 |
| G.2.3 | Rollback procedures documentation | Medium | 0.5d | DevOps | G.2.1 |
| **G.3: Monitoring & Alerting** |
| G.3.1 | Sentry error tracking configuration | Medium | 0.5d | DevOps | - |
| G.3.2 | Database query monitoring (pg_stat_statements) | Medium | 0.5d | Backend | - |
| G.3.3 | Alert on security events (failed logins, CSRF failures) | Medium | 0.5d | DevOps | - |

**Total Effort:** 7.5 days → **4 days** (parallelization)
**Critical Path:** G.1.1 → G.1.2 → G.1.5 → G.1.6 → G.2.1

---

### 2.3 Dependencies Graph

```mermaid
graph LR
    B1[B.1 Docker Fix] --> B6[B.6 Migration Review]
    B6 --> B7[B.7 Tenants Table]
    B7 --> C44[C.4.4 Tenant Middleware]
    C44 --> D41[D.4.1 RLS Policies]
    D41 --> F12[F.1.2 Tenant Tests]
    F12 --> F33[F.3.3 Leakage Tests]

    C11[C.1.1 SECRET_KEY Env] --> C12[C.1.2 Generate Key]
    C12 --> C13[C.1.3 Validation]
    C13 --> C21[C.2.1 Token Refresh]
    C21 --> C22[C.2.2 Token Revocation]

    C31[C.3.1 CSRF Middleware] --> C32[C.3.2 CSRF Tokens]

    D11[D.1.1 Fix TS Errors] --> D12[D.1.2 Strict Mode]

    C21 --> E11[E.1.1 Login Component]
    E11 --> E12[E.1.2 Auth Context]
    E12 --> E13[E.1.3 Protected Routes]

    F22[F.2.2 E2E Tests] --> G12[G.1.2 Test Workflow]
    G12 --> G15[G.1.5 Staging Deploy]
    G15 --> G16[G.1.6 Prod Deploy]
    G16 --> G21[G.2.1 Blue-Green]
```

---

## 3. Architecture & Component Design

### 3.1 Current Architecture

```mermaid
graph TB
    subgraph "Frontend (React 19 + TypeScript)"
        UI[User Interface]
        Router[React Router v7]
        State[TanStack Query + LocalForage]
        Maps[Leaflet + Deck.gl]
        SW[Service Worker PWA]
    end

    subgraph "Backend (FastAPI + Python 3.11)"
        API[API Gateway]
        Auth[JWT Auth Middleware]
        Routes[30+ API Endpoints]
        Spatial[Spatial Analysis]
        Analytics[Analytics Engine]
    end

    subgraph "Database Layer"
        PostGIS[(PostGIS/PostgreSQL)]
        Redis[(Redis Cache)]
        Files[File Storage]
    end

    subgraph "Infrastructure"
        Docker[Docker Compose]
        Nginx[Nginx Reverse Proxy]
        Sentry[Sentry Monitoring]
    end

    UI --> Router
    Router --> State
    State --> Maps
    UI --> SW

    Maps -->|HTTP/REST| API
    API --> Auth
    Auth --> Routes
    Routes --> Spatial
    Routes --> Analytics

    Routes --> PostGIS
    Routes --> Redis
    Routes --> Files

    Docker --> API
    Docker --> PostGIS
    Docker --> Redis
    Nginx --> Docker
    Sentry -.->|Errors| API
    Sentry -.->|Performance| Maps
```

### 3.2 Target Multi-Tenant Architecture

```mermaid
graph TB
    subgraph "Tenant A"
        UserA[User A]
    end

    subgraph "Tenant B"
        UserB[User B]
    end

    subgraph "Application Layer"
        LB[Load Balancer]
        API1[API Server 1]
        API2[API Server 2]

        LB --> API1
        LB --> API2
    end

    subgraph "Multi-Tenant Middleware"
        TenantResolver[Tenant Resolver]
        RBACEnforcer[RBAC Enforcer]
        CSRFValidator[CSRF Validator]

        API1 --> TenantResolver
        API2 --> TenantResolver
        TenantResolver --> RBACEnforcer
        RBACEnforcer --> CSRFValidator
    end

    subgraph "Data Isolation Layer"
        RLS[PostgreSQL RLS Policies]
        TenantDB[(PostGIS with RLS)]

        CSRFValidator --> RLS
        RLS --> TenantDB
    end

    subgraph "Shared Services"
        RedisCache[(Redis Cache)]
        CeleryWorker[Celery Workers]
        S3Storage[S3-Compatible Storage]
    end

    UserA -->|HTTPS + JWT| LB
    UserB -->|HTTPS + JWT| LB

    CSRFValidator --> RedisCache
    CSRFValidator --> CeleryWorker
    CSRFValidator --> S3Storage

    style TenantDB fill:#f9f,stroke:#333,stroke-width:4px
    style RLS fill:#ff9,stroke:#333,stroke-width:2px
```

### 3.3 Component Responsibilities

#### Frontend Components

| Component | Responsibility | Dependencies |
|-----------|---------------|--------------|
| **AuthContext** | Manage user session, token refresh, logout | React Context API, TanStack Query |
| **ProtectedRoute** | Route guard for authenticated pages | React Router v7, AuthContext |
| **MapView** | Render spatial data with Leaflet/Deck.gl | react-leaflet, @deck.gl/react |
| **HeatmapLayer** | Visualize density maps | leaflet.heat, GeoJSON API |
| **IssueReporter** | Community feedback submission | API client, FormData |
| **Sidebar** | Navigation + layer controls | lucide-react, @dnd-kit/sortable |

#### Backend Modules

| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| **Auth API** | User registration, login, JWT issuance | `app/api/auth_api.py`, `app/core/security.py` |
| **Tenant Middleware** | Inject tenant context into requests | `app/dependencies.py` |
| **RBAC Decorators** | Enforce role-based access control | `app/core/rbac.py` (new) |
| **Spatial Tools API** | Buffer, intersection, union operations | `app/api/spatial_tools_api.py` |
| **Visualization 3D API** | 3D terrain, building extrusion | `app/api/visualization_3d_api.py` |
| **Analytics API** | Spatial statistics, clustering | `app/api/analytics_api.py` |

#### Database Schema (Key Tables)

| Table | Columns | Indexes | RLS Policy |
|-------|---------|---------|------------|
| **tenants** | id, name, domain, created_at | PRIMARY KEY (id), UNIQUE (domain) | Public read, admin-only write |
| **users** | id, email, hashed_password, tenant_id, role | PRIMARY KEY (id), UNIQUE (email), INDEX (tenant_id) | Filter by tenant_id |
| **spatial_data** | id, tenant_id, geom, properties, created_at | PRIMARY KEY (id), GIST (geom), INDEX (tenant_id, geom) | Filter by tenant_id |
| **token_blacklist** | jti, user_id, expires_at | PRIMARY KEY (jti), INDEX (expires_at) | Filter by user_id |

---

## 4. Implementation Strategy

### 4.1 Agile Methodology

**Sprint Duration:** 2 weeks
**Team Size:** 2-4 engineers (1 Backend, 1 Frontend, 1 DevOps, 0.5 QA)
**Ceremonies:**
- Daily Standup (15 min)
- Sprint Planning (2 hours)
- Sprint Review (1 hour)
- Sprint Retrospective (1 hour)

### 4.2 Sprint Breakdown

#### Sprint 1 (Weeks 1-2): Foundation & Security

**Goals:**
- Complete Phase B (Infrastructure Stabilization)
- Complete Phase C (Security & Multi-Tenant Auth)
- Fix critical vulnerabilities (SECRET_KEY, CSRF)

**Stories:**

| ID | User Story | Story Points | Acceptance Criteria |
|----|-----------|--------------|---------------------|
| S1.1 | As a DevOps engineer, I need Docker Compose to run without errors | 5 | `docker compose up` succeeds, PostGIS accepts connections |
| S1.2 | As a security analyst, I need SECRET_KEY in environment variables | 8 | SECRET_KEY removed from code, validation on startup |
| S1.3 | As a backend developer, I need CSRF protection on all mutations | 8 | POST/PUT/DELETE return 403 without valid CSRF token |
| S1.4 | As a backend developer, I need tenant table and migrations | 5 | Alembic migration runs, tenants table created |
| S1.5 | As a user, I need JWT token refresh to stay logged in | 5 | Refresh endpoint returns new access token |

**Total:** 31 story points (~2 weeks for 3-person team)

---

#### Sprint 2 (Weeks 3-4): Multi-Tenant RBAC & Database Hardening

**Goals:**
- Complete Phase C.4 (Multi-Tenant RBAC)
- Complete Phase D (Backend & Database Hardening)
- Implement PostgreSQL RLS policies

**Stories:**

| ID | User Story | Story Points | Acceptance Criteria |
|----|-----------|--------------|---------------------|
| S2.1 | As a super_admin, I need to create/manage tenants | 8 | CRUD endpoints with role=super_admin enforcement |
| S2.2 | As a tenant_admin, I need to manage users in my tenant | 8 | Users can only see/edit users in their tenant |
| S2.3 | As a backend developer, I need RLS policies on all spatial tables | 13 | All queries auto-filter by tenant_id, verified with tests |
| S2.4 | As a frontend developer, I need TypeScript errors fixed | 8 | `npx tsc --noEmit` returns zero errors |
| S2.5 | As a backend developer, I need composite indexes on (tenant_id, geom) | 3 | EXPLAIN shows index usage for spatial queries |

**Total:** 40 story points (~2 weeks for 4-person team)

---

#### Sprint 3 (Weeks 5-6): Frontend UX & Auth Integration

**Goals:**
- Complete Phase E (Frontend UX & GIS Modernization)
- Integrate auth flows (login, register, protected routes)
- Improve performance and accessibility

**Stories:**

| ID | User Story | Story Points | Acceptance Criteria |
|----|-----------|--------------|---------------------|
| S3.1 | As a user, I need a login page to access the platform | 5 | Login form validates, redirects on success |
| S3.2 | As a user, I need protected routes for authenticated pages | 3 | Unauthenticated users redirected to login |
| S3.3 | As a user, I need automatic token refresh to stay logged in | 8 | Tokens refresh silently 5 min before expiry |
| S3.4 | As a user, I need fast map rendering with 100k+ features | 13 | Clustering enabled, < 1s render time |
| S3.5 | As a user with disabilities, I need WCAG 2.1 AA compliance | 8 | axe-core reports zero critical violations |

**Total:** 37 story points (~2 weeks for 3-person team)

---

#### Sprint 4 (Weeks 7-8): QA & CI/CD Automation

**Goals:**
- Complete Phase F (QA Verification & Automation)
- Complete Phase G (Continuous Deployment)
- Launch staging environment

**Stories:**

| ID | User Story | Story Points | Acceptance Criteria |
|----|-----------|--------------|---------------------|
| S4.1 | As a QA engineer, I need 80%+ test coverage | 13 | Coverage report shows ≥80% (backend + frontend) |
| S4.2 | As a security analyst, I need automated OWASP Top 10 scanning | 5 | ZAP scan runs in CI, fails on high-severity issues |
| S4.3 | As a DevOps engineer, I need CI/CD pipeline for staging | 8 | Merge to `develop` auto-deploys to staging |
| S4.4 | As a DevOps engineer, I need blue-green production deployment | 13 | Tag triggers deploy, health checks enable traffic switch |
| S4.5 | As a stakeholder, I need production monitoring with Sentry | 5 | Errors + performance tracked in Sentry dashboard |

**Total:** 44 story points (~2 weeks for 4-person team)

---

### 4.3 Iteration Milestones

```mermaid
gantt
    title Enterprise GIS Platform - 8-Week Roadmap
    dateFormat  YYYY-MM-DD
    section Sprint 1
    Phase B: Infrastructure           :done, s1b, 2026-02-11, 5d
    Phase C: Security & Auth           :active, s1c, 2026-02-16, 8d
    section Sprint 2
    Phase C.4: Multi-Tenant RBAC       :s2c, 2026-02-24, 5d
    Phase D: Database Hardening        :s2d, 2026-03-01, 6d
    section Sprint 3
    Phase E: Frontend Auth Integration :s3e, 2026-03-07, 7d
    Phase E: UX & Accessibility        :s3u, 2026-03-14, 5d
    section Sprint 4
    Phase F: QA & Testing              :s4f, 2026-03-19, 5d
    Phase G: CI/CD & Deployment        :s4g, 2026-03-24, 4d
    Production Launch                  :milestone, prod, 2026-03-28, 0d
```

---

## 5. QA & Testing Plan

### 5.1 Testing Pyramid

```mermaid
graph TD
    E2E[E2E Tests<br/>10%<br/>Critical User Flows]
    Integration[Integration Tests<br/>30%<br/>API + Database]
    Unit[Unit Tests<br/>60%<br/>Functions + Components]

    E2E --> Integration
    Integration --> Unit

    style E2E fill:#ff9999
    style Integration fill:#99ccff
    style Unit fill:#99ff99
```

### 5.2 Test Categories

#### 5.2.1 Backend Tests (Pytest)

| Category | Description | Tools | Target Coverage | Examples |
|----------|-------------|-------|-----------------|----------|
| **Unit Tests** | Test individual functions in isolation | pytest, pytest-mock | 70%+ | `test_hash_password()`, `test_generate_jwt()` |
| **Integration Tests** | Test API endpoints with real database | pytest, pytest-asyncio, TestClient | 60%+ | `test_register_user()`, `test_login_with_valid_credentials()` |
| **Spatial Tests** | Verify PostGIS spatial operations | pytest, geopandas, shapely | 50%+ | `test_buffer_creates_polygon()`, `test_intersection_returns_geojson()` |
| **Security Tests** | Test auth, RBAC, tenant isolation | pytest, pytest-security | 90%+ | `test_csrf_required()`, `test_tenant_isolation()` |

**Example Test:**

```python
# tests/test_auth_flow.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user_success():
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePassword123!",
        "tenant_id": 1
    })
    assert response.status_code == 201
    assert "access_token" in response.json()

def test_login_requires_csrf_token():
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "SecurePassword123!"
    })
    assert response.status_code == 403
    assert "CSRF token missing" in response.json()["detail"]
```

---

#### 5.2.2 Frontend Tests (Vitest + Playwright)

| Category | Description | Tools | Target Coverage | Examples |
|----------|-------------|-------|-----------------|----------|
| **Component Tests** | Test React components in isolation | Vitest, @testing-library/react | 70%+ | `test_login_form_validation()`, `test_map_renders_geojson()` |
| **Integration Tests** | Test component interactions | Vitest, @testing-library/react | 50%+ | `test_auth_context_provides_user()`, `test_protected_route_redirects()` |
| **E2E Tests** | Test full user workflows | Playwright | 30%+ | `test_user_can_login_and_view_map()`, `test_offline_sync_works()` |
| **Accessibility Tests** | Verify WCAG 2.1 AA compliance | axe-core, @axe-core/playwright | 100% | `test_no_critical_violations()`, `test_keyboard_navigation()` |

**Example Test:**

```typescript
// frontend/tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can login and access protected dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePassword123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});

test('protected route redirects unauthenticated users', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page).toHaveURL('http://localhost:3000/login');
});
```

---

#### 5.2.3 Security Tests (OWASP Top 10)

| Vulnerability | Test Approach | Tools | Acceptance Criteria |
|---------------|---------------|-------|---------------------|
| **A01: Broken Access Control** | Tenant isolation, RBAC bypass attempts | Custom pytest, OWASP ZAP | No cross-tenant data leakage |
| **A02: Cryptographic Failures** | SECRET_KEY strength, password hashing | hashcat, pytest | bcrypt with cost ≥12 |
| **A03: Injection** | SQL injection in spatial queries | sqlmap, pytest | Parameterized queries only |
| **A04: Insecure Design** | CSRF, JWT expiry, rate limiting | Custom pytest, Burp Suite | CSRF on all mutations, JWT < 15min |
| **A05: Security Misconfiguration** | Hardcoded secrets, debug mode | bandit, safety | Zero hardcoded secrets |
| **A07: Authentication Failures** | Brute force, weak passwords | hydra, pytest | Rate limiting + password policy |

**Example Security Test:**

```python
# tests/test_security.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_cross_tenant_data_leakage():
    """Verify users cannot access data from other tenants"""
    # Login as Tenant A user
    token_a = client.post("/api/auth/login", json={
        "email": "user_a@tenant_a.com",
        "password": "password"
    }).json()["access_token"]

    # Try to access Tenant B data
    response = client.get(
        "/api/spatial_data?tenant_id=2",  # Tenant B ID
        headers={"Authorization": f"Bearer {token_a}"}
    )

    assert response.status_code == 403
    assert len(response.json()["data"]) == 0  # No data from Tenant B
```

---

### 5.3 Performance Benchmarking

#### Load Testing (Locust)

**Scenario:** 1000 concurrent users accessing spatial API

```python
# tests/performance/locustfile.py
from locust import HttpUser, task, between

class GISUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Login once per user
        response = self.client.post("/api/auth/login", json={
            "email": "loadtest@example.com",
            "password": "password"
        })
        self.token = response.json()["access_token"]

    @task(3)
    def view_map(self):
        self.client.get(
            "/api/spatial_data?bbox=-180,-90,180,90",
            headers={"Authorization": f"Bearer {self.token}"}
        )

    @task(1)
    def create_annotation(self):
        self.client.post(
            "/api/annotations",
            json={"geom": {"type": "Point", "coordinates": [18.4, -33.9]}, "notes": "Test"},
            headers={"Authorization": f"Bearer {self.token}"}
        )
```

**Run:** `locust -f tests/performance/locustfile.py --users 1000 --spawn-rate 10 --host https://staging.geohub.capetown`

**Target Metrics:**
- p95 response time < 500ms
- Error rate < 1%
- Throughput ≥ 100 req/s

---

## 6. DevOps & Deployment Plan

### 6.1 CI/CD Pipeline Architecture

```mermaid
graph LR
    A[Git Push] --> B{Branch?}
    B -->|feature/*| C[Lint + Test]
    B -->|develop| D[Lint + Test + Build]
    B -->|tag v*| E[Lint + Test + Build + Release]

    C --> F[Status Check]
    D --> G[Deploy Staging]
    E --> H[Deploy Production]

    G --> I[Health Checks]
    H --> J[Blue-Green Switch]

    I -->|Failed| K[Rollback]
    J -->|Failed| L[Rollback]

    style G fill:#99ccff
    style H fill:#ff9999
    style K fill:#ffcc99
    style L fill:#ffcc99
```

### 6.2 GitHub Actions Workflows

#### Workflow 1: Lint & Type Check

```yaml
# .github/workflows/lint.yml
name: Lint & Type Check

on:
  push:
    branches: ['**']
  pull_request:

jobs:
  backend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install ruff mypy
      - run: ruff check app/
      - run: mypy app/ --strict

  frontend-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run type-check
        working-directory: frontend
```

---

#### Workflow 2: Test Suite

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [develop, main]
  pull_request:

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: kartoza/postgis:15-3.4
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest --cov=app --cov-report=xml
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/gis_test
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
        working-directory: frontend
      - run: npm run test:unit
        working-directory: frontend
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        working-directory: frontend
```

---

#### Workflow 3: Security Audit

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [develop, main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  backend-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install pip-audit
      - run: pip-audit --strict

  frontend-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
        working-directory: frontend
      - run: npm audit --audit-level=high
        working-directory: frontend

  owasp-zap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://staging.geohub.capetown'
```

---

#### Workflow 4: Deploy to Staging

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - run: docker compose build
      - run: docker compose push
      - uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/geohub
            docker compose pull
            docker compose up -d --no-deps --build
            docker compose exec -T api alembic upgrade head
            ./scripts/health-check.sh || docker compose rollback
```

---

### 6.3 Deployment Environments

| Environment | URL | Database | Auto-Deploy | Purpose |
|-------------|-----|----------|-------------|---------|
| **Development** | http://localhost:3000 | SQLite/Local PostGIS | No | Local development |
| **Staging** | https://staging.geohub.capetown | RDS PostGIS (replica) | On merge to `develop` | Pre-production testing |
| **Production** | https://geohub.capetown | RDS PostGIS (primary) | On tag `v*.*.*` | Live users |

### 6.4 Blue-Green Deployment Strategy

**Procedure:**

1. **Pre-Deployment:**
   - Run database migrations on staging (manual approval required for production)
   - Build Docker images with git SHA tag
   - Run smoke tests against staging

2. **Deployment:**
   - Deploy "green" environment (new version) behind load balancer
   - Run health checks (30s timeout):
     - `GET /health` returns 200
     - `GET /api/spatial_data` returns valid GeoJSON
     - Database connection successful
   - If health checks pass: switch traffic to green (10% → 50% → 100% over 5 min)
   - If health checks fail: keep traffic on blue, alert on Slack

3. **Post-Deployment:**
   - Monitor error rates in Sentry for 15 minutes
   - If error rate > 5%: automatic rollback to blue
   - Otherwise: keep green as active, mark blue as standby

4. **Rollback:**
   - Switch traffic back to blue (immediate)
   - Rollback database migrations (if applicable)
   - Post-mortem in #incidents Slack channel

**Scripts:**

```bash
# scripts/health-check.sh
#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:8000}"
MAX_RETRIES=10
RETRY_DELAY=3

echo "Running health checks against $BASE_URL..."

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i/$MAX_RETRIES..."

  # Check health endpoint
  curl -f "$BASE_URL/health" || { echo "Health check failed"; exit 1; }

  # Check API endpoint
  curl -f "$BASE_URL/api/spatial_data?limit=1" | jq '.data' || { echo "API check failed"; exit 1; }

  echo "Health check passed!"
  exit 0
done

echo "Health checks failed after $MAX_RETRIES attempts"
exit 1
```

---

## 7. Risk Management

### 7.1 Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|-----------|--------|------------|-------|
| R1 | SECRET_KEY exposure in production | High | Critical | Move to env var (C.1.1), audit git history | Backend |
| R2 | Tenant data leakage via SQL injection | Medium | Critical | Parameterized queries (D.2.1), RLS policies (D.4.1) | Backend |
| R3 | Docker permission issues block deployment | High | High | Fix in B.1, document troubleshooting | DevOps |
| R4 | TypeScript errors block CI | High | Medium | Fix in D.1.1, enable strict mode | Frontend |
| R5 | Performance degradation with 100k+ features | Medium | High | Clustering (E.2.2), spatial indexes (D.3.2) | Backend/Frontend |
| R6 | CSRF bypass via misconfiguration | Low | Critical | Add tests (F.3.1), penetration testing | Security |
| R7 | Zero-downtime deployment fails | Medium | Medium | Blue-green strategy (G.2.1), automated rollback | DevOps |
| R8 | WCAG compliance fails accessibility audit | Medium | Medium | axe-core integration (E.3.1), manual testing | Frontend |

### 7.2 Risk Mitigation Timeline

```mermaid
gantt
    title Risk Mitigation Schedule
    dateFormat  YYYY-MM-DD
    section Critical Risks
    R1: SECRET_KEY Fix           :done, r1, 2026-02-11, 1d
    R2: SQL Injection Prevention :r2, 2026-02-25, 5d
    R6: CSRF Testing             :r6, 2026-03-20, 2d
    section High Risks
    R3: Docker Permissions       :done, r3, 2026-02-11, 2d
    R4: TypeScript Errors        :r4, 2026-02-28, 2d
    R5: Performance Optimization :r5, 2026-03-10, 5d
    section Medium Risks
    R7: Deployment Strategy      :r7, 2026-03-24, 3d
    R8: Accessibility Compliance :r8, 2026-03-15, 3d
```

---

## 8. Documentation & Knowledge Transfer Plan

### 8.1 Documentation Deliverables

| Document | Format | Audience | Owner | Deadline |
|----------|--------|----------|-------|----------|
| **API Reference** | OpenAPI 3.1 (Swagger UI) | Developers | Backend | Sprint 2 |
| **Deployment Guide** | Markdown | DevOps | DevOps | Sprint 4 |
| **Multi-Tenant Setup** | Markdown | Admins | Backend | Sprint 2 |
| **Frontend Component Library** | Storybook | Frontend Devs | Frontend | Sprint 3 |
| **Security Runbook** | Markdown | Security/Ops | Security | Sprint 1 |
| **Performance Tuning Guide** | Markdown | DevOps/Backend | Backend | Sprint 3 |
| **User Guide** | Markdown + Screenshots | End Users | Frontend | Sprint 4 |

### 8.2 Knowledge Transfer Sessions

| Session | Topics | Duration | Attendees | Date |
|---------|--------|----------|-----------|------|
| **Architecture Deep Dive** | Multi-tenant design, RLS policies, RBAC | 2 hours | All engineers | End of Sprint 2 |
| **Security Best Practices** | CSRF, JWT, tenant isolation testing | 1.5 hours | Backend + Security | End of Sprint 1 |
| **Frontend Performance** | Clustering, virtual scrolling, lazy loading | 1 hour | Frontend | End of Sprint 3 |
| **CI/CD Pipeline** | GitHub Actions, blue-green deployment | 1 hour | DevOps + Backend | End of Sprint 4 |

### 8.3 Documentation Structure

```
docs/
├── architecture/
│   ├── overview.md
│   ├── multi-tenant-design.md
│   ├── database-schema.md
│   └── component-diagram.mmd
├── api/
│   ├── openapi.yaml (auto-generated)
│   ├── authentication.md
│   └── spatial-endpoints.md
├── deployment/
│   ├── prerequisites.md
│   ├── docker-setup.md
│   ├── environment-variables.md
│   ├── blue-green-deployment.md
│   └── rollback-procedures.md
├── security/
│   ├── threat-model.md
│   ├── rbac-matrix.md
│   ├── penetration-testing.md
│   └── incident-response.md
├── development/
│   ├── local-setup.md
│   ├── testing-guide.md
│   ├── linting-and-formatting.md
│   └── git-workflow.md
└── user-guide/
    ├── getting-started.md
    ├── creating-maps.md
    ├── spatial-analysis.md
    └── troubleshooting.md
```

---

## 9. Next Steps & Call to Action

### 9.1 Immediate Actions (This Week)

1. ✅ **Approve Execution Plan:** Review this document, provide feedback, approve to proceed
2. 🚀 **Sprint 1 Kickoff:** Schedule sprint planning meeting (2 hours)
3. 🔒 **Critical Security Fix:** Execute C.1.1-C.1.3 (SECRET_KEY → environment variable)
4. 🐳 **Docker Stabilization:** Execute B.1 (fix PostGIS volume permissions)
5. 📦 **Dependency Installation:** Execute B.3 (email-validator, passlib)

### 9.2 Artifact Generation

Would you like me to generate additional artifacts?

- [ ] **Gantt Chart (Detailed):** Export 8-week timeline with dependencies as `.mmd` Mermaid file
- [ ] **Sprint Board (Jira/GitHub Projects):** JSON export for importing stories into project management tool
- [ ] **Checklist Exports:** Markdown checklists for each phase (copy-paste into issues/PRs)
- [ ] **Architecture Diagrams:** High-resolution SVG exports of all Mermaid diagrams
- [ ] **Risk Assessment Matrix:** Excel/CSV export for risk tracking dashboard
- [ ] **Test Plan Matrix:** Comprehensive test case matrix (feature × test type)

### 9.3 Approval Workflow

**Phase A Complete ✅**
**Awaiting Approval to Proceed:**

1. **Plan Review:** Stakeholders review this document (deadline: 2026-02-13)
2. **Budget Approval:** Confirm 8-12 week timeline and 2-4 engineer allocation
3. **Sprint 1 Go/No-Go:** Approve immediate start on Phase B + C (Security Critical)

**Approval Signoff:**

| Stakeholder | Role | Status | Date |
|------------|------|--------|------|
| Project Manager | Plan Approval | ⏳ Pending | - |
| Tech Lead | Architecture Review | ⏳ Pending | - |
| Security Lead | Security Design Approval | ⏳ Pending | - |
| Product Owner | Scope & Priorities | ⏳ Pending | - |

---

## 10. Appendix

### 10.1 Technology Stack Reference

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.2.0 | UI framework |
| | TypeScript | 5.9.3 | Type safety |
| | Vite | 6.0.0 | Build tool |
| | Leaflet | 1.9.4 | 2D mapping |
| | Deck.gl | 9.0.0 | 3D visualization |
| | TanStack Query | 5.90.20 | Data fetching |
| | Tailwind CSS | 4.1.18 | Styling |
| **Backend** | Python | 3.11 | Runtime |
| | FastAPI | 0.128.4 | API framework |
| | SQLAlchemy | 2.0+ | ORM |
| | GeoAlchemy2 | 0.14+ | Spatial ORM |
| | Alembic | 1.13+ | Migrations |
| | Pydantic | 2.5+ | Validation |
| **Database** | PostgreSQL | 15 | RDBMS |
| | PostGIS | 3.3 | Spatial extension |
| | Redis | 5.0+ | Caching |
| **Infrastructure** | Docker | 24+ | Containerization |
| | Nginx | 1.25 | Reverse proxy |
| | Sentry | 1.39+ | Monitoring |
| | Celery | 5.3+ | Background tasks |
| **Testing** | Pytest | 8.0 | Backend testing |
| | Vitest | 4.0.18 | Frontend unit tests |
| | Playwright | 1.49 | E2E testing |
| | Locust | 2.15+ | Load testing |

### 10.2 Glossary

| Term | Definition |
|------|------------|
| **CSRF** | Cross-Site Request Forgery - attack forcing users to execute unwanted actions |
| **JWT** | JSON Web Token - stateless authentication token standard |
| **RBAC** | Role-Based Access Control - permission model based on user roles |
| **RLS** | Row-Level Security - PostgreSQL feature for tenant data isolation |
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines level AA compliance |
| **Blue-Green Deployment** | Zero-downtime deployment strategy with two identical environments |
| **PostGIS** | Spatial database extension for PostgreSQL |
| **GIST Index** | Generalized Search Tree - index type for spatial data |
| **p95** | 95th percentile - performance metric (95% of requests faster than this) |

### 10.3 Contact & Support

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| **Project Manager** | TBD | pm@geohub.capetown | Mon-Fri 9am-5pm SAST |
| **Tech Lead** | TBD | tech@geohub.capetown | Mon-Fri 8am-6pm SAST |
| **Security Lead** | TBD | security@geohub.capetown | On-call 24/7 |
| **DevOps Engineer** | TBD | devops@geohub.capetown | Mon-Fri 9am-5pm SAST |

---

**Document Version:** 2.0
**Last Updated:** 2026-02-11
**Next Review:** 2026-02-25 (End of Sprint 1)
**Status:** 📋 Awaiting Approval

---

*This execution plan is a living document. Updates will be made at the end of each sprint based on retrospective feedback and changing requirements.*
