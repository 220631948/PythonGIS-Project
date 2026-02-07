# Phase Progress Tracker — Cape Town GeoHub

## Phase A: Frontend Core Infrastructure Overhaul ✅ COMPLETE
- PR #18 merged to master (squash merge, SHA: 52c821ff)
- Tasks A1–A7 all completed
- 30 files changed, 3,740 insertions, 1,547 deletions
- 38 unit tests, zero `any` in domain modules

## Phase B: Backend/Spatial/Database Refactor 🔄 IN PROGRESS
**Branch:** `refactor/backend-phase-B` (from updated master)

### Completed Tasks:
- [x] **B1: SQL Injection Elimination** (commit 4d37115)
  - Added `_safe_table_name()` validator in `app/core/data_loader.py` (regex + double-quoting)
  - Fixed 3 f-string SQL injection points in `get_paginated_gdf()` and `get_gdf()`
  - Added input validation in `app/main.py` `proxy_data()` endpoint
  - Bind parameters used for LIMIT/OFFSET values
  
- [x] **B2: Database Module Hardening** (commit edc427e)
  - `app/core/database.py` no longer crashes on missing DATABASE_URL
  - Added `require_engine()` helper for safe lazy access  
  - Sync engine + SessionLocal only created when DATABASE_URL is set
  - `data_loader.py` uses `require_engine()` (6 call sites)
  - `spatial_analysis/services.py` uses `require_engine()`
  - Async `create_engine_with_retry` validates DATABASE_URL first

- [x] **B5: Cache Replacement — TTL-bounded** (commit 89d8f09)
  - Replaced unbounded `_response_cache` dict + `_cache_timestamps` with `cachetools.TTLCache`
  - Bounded to 256 entries max, 300s TTL, automatic eviction
  - Updated `clear_cache` endpoint to report evicted entries
  - CacheManager: added `_evict_oldest()` with MAX_METADATA_ENTRIES=100
  - Added `cachetools>=5.3.0` to requirements.txt

- [x] **B6: Auth Middleware — Admin API Keys** (commit 0d07ddd)
  - Added `ADMIN_API_KEY` to Settings (configurable via .env)
  - Created `require_admin_key()` dependency in `app/dependencies.py`
  - Protected `/api/stats`, `/api/cache/clear`, `/api/config` with `X-Admin-API-Key` header
  - Graceful degradation: empty key = open access (dev mode) + warning log
  - Updated `.env.example` with documentation

- [x] **B7: Router Consolidation & Pydantic** (commit 0e3d325)
  - Created `app/models/response_models.py` with typed schemas
  - Added `response_model` to 5 endpoints: `/health`, `/api/health`, `/api/stats`, `/api/cache/clear`, `/api/config`
  - Models: HealthResponse, DetailedHealthResponse, StatsResponse, ConfigResponse, CacheClearResponse
  - Includes PaginatedGeoResponse, ErrorResponse for future use

- [x] **B8: Site Suitability Cleanup** (commit 5b71f18)
  - Added `data_source` field to CriterionResult ("postgis", "arcgis", "placeholder", "error")
  - Replaced all hardcoded evaluator logic with honest placeholder returns
  - Added TODO comments on every `_eval_*` method documenting PostGIS layer + query
  - Added PLACEHOLDER_NOTE constant, wrapped evaluators in try/except
  - `_generate_recommendations` now warns when placeholder data is used

### Deferred Tasks:
- [ ] **B3: DataLoader Architecture Cleanup** — Mixed sync/async patterns (complex, low priority)
- [ ] **B4: Async/Sync Engine Hygiene** — Clean separation (complex, low priority)

### Key Pattern Notes for Future Tasks:
- `app/main.py` has inline response cache dict (`_response_cache`, `_cache_timestamps`) — B5 target
  - Lines ~180-195: `get_cached_response()` and `set_cached_response()` use plain dicts, no eviction, no max size
  - `CACHE_TTL_SECONDS = 300` (5 minutes), but items only purged on next read
- Admin endpoints (`/api/cache/clear` POST, `/api/config` GET, `/api/stats` GET) have NO auth — B6 target
- `CacheManager` in `app/core/cache_manager.py` is file-based with JSON metadata, decent but no size bounds
- Site suitability evaluators in `app/spatial_analysis/site_suitability.py` all return hardcoded values — B8 target
- 23 API router files in `app/api/` — B7 scope
- `app/core/data_loader.py` uses sync `requests` in async routes — B3/B4 target
- Repo: 220631948/PythonGIS-Project, branch: refactor/backend-phase-B
- Process rule: pause before merging any Phase B PRs to master, provide burndown summaries
- B3/B4 combined: fix mixed sync/async in DataLoader (data_loader.py uses sync requests + sync engine in async FastAPI routes)

### Current working state:
- On branch: refactor/backend-phase-B  
- Last push: 5b71f18 (B8 commit)
- Commit history: 5b71f18 (B8) → 0e3d325 (B7) → 0d07ddd (B6) → 89d8f09 (B5) → edc427e (B2) → 4d37115 (B1) → 52c821ff (Phase A merge)
- All B tasks complete (B1, B2, B5, B6, B7, B8). B3/B4 deferred.
- Next: Create draft PR, run security scans (semgrep, bandit), present burndown to user.
- IMPORTANT: Pause before merging Phase B PR to master. Show burndown summary to user.
- Repo: 220631948/PythonGIS-Project

### B5 Implementation Plan (Cache Replacement):
1. Replace `_response_cache` / `_cache_timestamps` dicts in `app/main.py` (lines ~180-195)
   with a proper TTL-bounded cache using `cachetools.TTLCache` (max 256 entries, 300s TTL)
2. The `get_cached_response()` and `set_cached_response()` functions in main.py need rewriting
3. Also clean up CacheManager in `app/core/cache_manager.py` (add size-bounded metadata)
4. pip install cachetools or implement manually with OrderedDict

### B6 Implementation Plan (Auth Middleware):
1. Add API key middleware for admin endpoints: `/api/cache/clear`, `/api/config`, `/api/stats`
2. Read ADMIN_API_KEY from settings/environment
3. Use FastAPI Depends() with API key header validation
4. Non-admin endpoints remain public

### B7 Implementation Plan (Router Consolidation):
1. Add consistent Pydantic response models for GeoJSON responses
2. Add `response_model` annotations to key router endpoints
3. Create `app/models/response_models.py` for shared Pydantic schemas

### B8 Implementation Plan (Site Suitability Cleanup):
1. `app/spatial_analysis/site_suitability.py` — all _eval_* methods return hardcoded values
2. Wire them to actual PostGIS queries via require_engine()
3. Or at minimum, add clear TODO markers and make them fail gracefully
