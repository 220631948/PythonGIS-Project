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

### Remaining Tasks:
- [ ] **B3: DataLoader Architecture Cleanup** — Mixed sync/async patterns
- [ ] **B4: Async/Sync Engine Hygiene** — Clean separation
- [ ] **B5: Cache Replacement (TTL-bounded)** — Replace unbounded dict cache in main.py + file-based CacheManager
- [ ] **B6: Auth Middleware (Admin API Keys)** — Protect /api/cache/clear, /api/config, /api/stats
- [ ] **B7: Router Consolidation & Pydantic** — Consistent response models, response_model annotations
- [ ] **B8: Site Suitability Cleanup** — Connect hardcoded evaluators to actual spatial queries

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
- Last push: 2a262ca (progress tracker commit)
- Next task: B5 (replace unbounded dict cache in main.py with TTL-bounded LRU cache)
- Then: B6 (auth middleware for admin endpoints), B7 (router consolidation), B8 (suitability cleanup)
- After all B tasks: create draft PR for review, run semgrep + bandit

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
