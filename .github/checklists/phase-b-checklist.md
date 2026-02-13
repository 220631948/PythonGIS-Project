# Phase B: Infrastructure Stabilization — Checklist

**Sprint:** 1
**Duration:** 5 days
**Priority:** Critical
**Owner:** DevOps + Backend

---

## B.1: Docker & MCP Health (2 days)

### B.1.1: Fix Docker Compose PostGIS Permissions ⚠️ CRITICAL
- [ ] Verify Docker is running: `docker info`
- [ ] Check compose.yaml for PostGIS volume configuration
- [ ] Fix volume permissions: `sudo chown -R $(id -u):$(id -g) ./data/postgres`
- [ ] Alternative: Use named volumes instead of bind mounts
- [ ] Test: `docker compose up -d db`
- [ ] Verify: `docker compose logs db | grep "database system is ready"`
- [ ] Verify: `docker compose exec db psql -U postgres -c "SELECT PostGIS_version();"`

### B.1.2: Create Health Check Scripts
- [ ] Create `scripts/health-check.sh` with:
  - [ ] Database connectivity check (psql)
  - [ ] API health endpoint check (curl /health)
  - [ ] Frontend build verification (curl localhost:3000)
- [ ] Make executable: `chmod +x scripts/health-check.sh`
- [ ] Test: `./scripts/health-check.sh`
- [ ] Add to CI: `.github/workflows/health-check.yml`

---

## B.2: Environment Reproducibility (1 day)

### B.2.1: Audit .env.example Completeness
- [ ] Compare .env.example with app/dependencies.py settings usage
- [ ] Add missing variables:
  - [ ] `SECRET_KEY=changeme_generate_secure_key_32_chars`
  - [ ] `ADMIN_API_KEY=changeme_generate_admin_key`
  - [ ] `DATABASE_URL=postgresql://user:pass@localhost:5432/gis`
  - [ ] `REDIS_URL=redis://localhost:6379/0`
  - [ ] `SENTRY_DSN=https://...`
- [ ] Document each variable with inline comments
- [ ] Verify no production secrets in .env.example

### B.2.2: Create Environment Validation Script
- [ ] Create `scripts/validate-env.py`:
  - [ ] Check all required env vars are set
  - [ ] Validate SECRET_KEY length ≥ 32
  - [ ] Validate DATABASE_URL format
  - [ ] Warn if DEBUG=True in production
- [ ] Add to pre-start hook in main.py
- [ ] Test with missing env vars

---

## B.3: Dependency Management (1.5 days)

### B.3.1: Install Missing Packages ⚠️ CRITICAL
- [ ] Install backend: `pip install email-validator passlib[bcrypt]`
- [ ] Verify import: `python -c "import email_validator; import passlib"`
- [ ] Update requirements.txt with exact versions
- [ ] Test auth flow: `pytest tests/test_auth_flow.py`

### B.3.2: Run Security Audits
- [ ] Backend audit: `pip install pip-audit && pip-audit --strict`
- [ ] Fix vulnerabilities or document exceptions
- [ ] Frontend audit: `cd frontend && npm audit --audit-level=high`
- [ ] Fix vulnerabilities: `npm audit fix`
- [ ] Generate audit reports: Save to `.github/security-audit-report.md`

### B.3.3: Pin All Dependencies
- [ ] Backend: `pip freeze > requirements-frozen.txt`
- [ ] Update requirements.txt with pinned versions (==X.Y.Z)
- [ ] Frontend: Verify package.json has exact versions (no ^, ~)
- [ ] Test build: `pip install -r requirements.txt && cd frontend && npm ci`

### B.3.4: Create Dependency Update Policy
- [ ] Document in `.github/DEPENDENCY_POLICY.md`:
  - [ ] Monthly security audits (first Monday)
  - [ ] Quarterly major version updates
  - [ ] Process for reviewing breaking changes
  - [ ] Approval workflow for dependency PRs

---

## B.4: Database Migrations (2 days)

### B.4.1: Review Alembic Migration Status
- [ ] Check current revision: `alembic current`
- [ ] List all migrations: `alembic history`
- [ ] Verify migration files in `alembic/versions/`
- [ ] Test upgrade: `alembic upgrade head` (on dev DB)
- [ ] Test downgrade: `alembic downgrade -1`

### B.4.2: Create Migration for Tenants Table ⚠️ CRITICAL
- [ ] Generate migration: `alembic revision -m "add_tenants_table"`
- [ ] Edit migration file:
  ```python
  def upgrade():
      op.create_table(
          'tenants',
          sa.Column('id', sa.Integer, primary_key=True),
          sa.Column('name', sa.String(255), nullable=False),
          sa.Column('domain', sa.String(255), unique=True, nullable=False),
          sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
          sa.Column('is_active', sa.Boolean, default=True)
      )
  ```
- [ ] Add sample data for testing (tenant_id=1 for local dev)
- [ ] Test: `alembic upgrade head`

### B.4.3: Add Indexes for tenant_id Foreign Keys
- [ ] Generate migration: `alembic revision -m "add_tenant_id_indexes"`
- [ ] Add indexes:
  - [ ] `CREATE INDEX idx_spatial_data_tenant_id ON spatial_data(tenant_id);`
  - [ ] `CREATE INDEX idx_users_tenant_id ON users(tenant_id);`
  - [ ] (Repeat for all 8+ spatial tables)
- [ ] Test migration performance on large dataset
- [ ] Verify index usage: `EXPLAIN SELECT * FROM spatial_data WHERE tenant_id = 1;`

### B.4.4: Setup Migration CI Checks
- [ ] Create `.github/workflows/migrations.yml`:
  - [ ] Run `alembic check` to detect missing migrations
  - [ ] Test upgrade/downgrade on fresh DB
  - [ ] Fail PR if migrations are not reversible
- [ ] Document migration workflow in `docs/development/migrations.md`

---

## Acceptance Criteria (Phase B Complete)

- [ ] ✅ `docker compose up` succeeds without errors
- [ ] ✅ PostGIS accepts connections and returns version
- [ ] ✅ Health check script returns 0 exit code
- [ ] ✅ All environment variables documented in .env.example
- [ ] ✅ pip-audit and npm audit report zero high/critical vulnerabilities
- [ ] ✅ All dependencies pinned to exact versions
- [ ] ✅ Alembic migrations run successfully (upgrade + downgrade)
- [ ] ✅ Tenants table created with sample data
- [ ] ✅ Indexes added for all tenant_id foreign keys
- [ ] ✅ Migration CI checks pass

---

## Troubleshooting

### Docker Permission Denied
**Error:** `mkdir: cannot create directory '/var/lib/postgresql/data': Permission denied`

**Fix:**
```bash
# Option 1: Change ownership
sudo chown -R $(id -u):$(id -g) ./data/postgres

# Option 2: Use named volumes (edit docker-compose.yml)
volumes:
  postgres_data:
    driver: local
```

### Alembic "Can't Locate Revision"
**Error:** `Can't locate revision identified by 'abc123'`

**Fix:**
```bash
# Reset to base
alembic downgrade base

# Reapply
alembic upgrade head
```

### Missing PostGIS Extension
**Error:** `ERROR: type "geometry" does not exist`

**Fix:**
```sql
-- Connect to database
psql -U postgres -d gis

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

---

**Status:** ⏳ In Progress
**Last Updated:** 2026-02-11
**Next Phase:** Phase C (Security & Multi-Tenant Auth)
