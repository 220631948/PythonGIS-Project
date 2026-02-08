# Phase C Refactor Report — Cape Town GeoHub

## Before / After Metrics

| Metric | Before (pre-Phase C) | After (master @ 49a56a5) | Notes |
| --- | --- | --- | --- |
| **Frontend bundle** | Map-heavy build included Realtime MapView chunk (no recorded size) | Vite build (2026-02-08): `index-D2_Pj5_C.js` **394.45 kB** (gzip **116.83 kB**); vendor-leaflet **156.45 kB**; vendor-turf **299.47 kB** | MapView + Playwright perf test removed; fewer Leaflet sub-chunks. |
| **Vulnerability count (pip-audit --strict)** | 3 CVEs (fastapi 0.109.1, python-multipart 0.0.9, gunicorn 21.2.0) | **1 CVE**: geopandas 0.14.2 → CVE-2025-69662 (fix: 1.1.2) | Audit run with `pip-audit 2.10.0` in `.venv311`. |
| **Line count** | Baseline before PR #21 | Net **-1,655 LOC** (35 insertions / 1,690 deletions) | Realtime API, MapView, perf scripts removed. |

## Key Architectural Changes

- **Security & Supply Chain**: FastAPI 0.128.4, python-multipart 0.0.22, gunicorn 23.0.0; CORS locked to explicit origins; compose now requires `${POSTGRES_USER}` / `${POSTGRES_PASSWORD}` / `${POSTGRES_DB}`.
- **Auth Middleware**: `require_admin_key` guards `/api/stats`, `/api/cache/clear`, `/api/config`; `.env.example` documents ADMIN_API_KEY (mandatory for prod).
- **DataLoader Hardening**: `require_engine()` gating prevents eager DB engine creation; DB-less mode raises `DatabaseConnectionError` instead of crashing.
- **Frontend Cleanup**: Removed legacy `MapView.tsx`, Leaflet draw/minimap extras, and Playwright perf test; bundle now leans on shared CSS variables (no Tailwind).
- **Docker Alignment**: Both dev/prod compose use `postgis/postgis:15-3.4` with named `postgres_data` volume.

## Test & Audit Summary (master)

- `npm run build` (frontend): **PASS** (vite v6.4.1). Main bundle 394.45 kB (gzip 116.83 kB).
- `pip-audit --strict`: **FAIL** — 1 vulnerability
  - `geopandas 0.14.2` → **CVE-2025-69662** (fixed in 1.1.2).
- `.venv311/bin/pytest`: **FAIL** — 11 failed, 132 passed, 9 skipped (45 min run)
  - **Realtime API**: `test_refresh_feed`, `test_refresh_all_feeds`, `test_get_status` (API still returns placeholder/405, missing `total_feeds` metadata).
  - **Spatial tools**: `test_buffer_endpoint` fails when `DATABASE_URL` unset (DatabaseConnectionError).
  - **Data loader pagination**: `test_get_paginated_gdf_fallback` (DB required) and `test_get_paginated_gdf_postgis_success` (attribute mismatch with data_loader).
  - **Integration**: `test_frontend_index`, `test_api_health_integration`, `test_cors_headers`, `test_error_handling_404` fail because no running backend at expected base URL (ConnectionError).
  - **Open data completeness**: `test_suburbs_has_minimum_features` sees only 10 records (service truncation).
  - Skips: PostGIS-dependent suites and slow eGIS endpoints when unavailable.

## Remaining Technical Debt

- **Realtime module**: Three tests still fail; endpoints return partial payloads/405 and lack `total_feeds`. Needs either full removal or stable contract.
- **Site Suitability**: Evaluators remain placeholders (`app/spatial_analysis/site_suitability.py`); still marked TODO for real PostGIS logic.
- **DB-less runtime**: Several tests fail without `DATABASE_URL`; consider injectable fakes or skip markers for CI when DB is absent.
- **Geopandas CVE**: Upgrade to geopandas ≥1.1.2 (and compatible pandas/pyproj stack) to restore a clean audit.
- **Integration harness**: Tests expect live FastAPI on localhost:8000; add `uvicorn` test fixture or document manual start before running full suite.

## .env Setup (post-Phase C)

1. Copy `.env.example` → `.env`.
2. Set **required** DB vars: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`. Compose will fail fast if unset.
3. Ensure `DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}` (compose already exports these).
4. Set `ADMIN_API_KEY` for production (protects `/api/config`, `/api/stats`, `/api/cache/clear`). Leave empty only for local dev.
5. Optional: adjust `CORS_ORIGINS` to your allowed frontends; defaults cover localhost Vite/React ports.
6. Restart services after editing `.env` (`docker compose up -d --build` or `uvicorn app.main:app --reload`).

## Next Steps

- Decide on geopandas upgrade window to clear the new CVE.
- Address realtime contract (or formally deprecate) and add DB-aware skips/fixtures for spatial/data-loader tests.
- Add a lightweight `uvicorn` test fixture to satisfy integration tests without manual server startup.