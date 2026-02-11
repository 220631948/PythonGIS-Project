# Execution Plan — MapView Integration & API Gateway Fixes

**Trace ID**: `trace-mapview-fix-001`
**Date**: 2026-02-11
**Agent**: SUPER-AGENT v3 (SAFE_MODE enabled)

---

## Root Cause Analysis

### 1. API 500 Errors (6 endpoints)

| Endpoint | Root Cause | Fix |
|----------|-----------|-----|
| `/api/health` | `psutil.cpu_percent(interval=1)` blocks event loop for 1s; works but slow | Add timeout protection, non-blocking |
| `/api/data-status/health` | `data_loader.check_all_sources_health_async()` hits external ArcGIS → timeouts cascade to 500 | Add per-source try/catch, return partial results |
| `/api/data-status/eval-log` | Endpoint path mismatch: frontend calls `/eval-log` but API defines `/retrieval-log` | Fix frontend path or add alias route |
| `/api/geocode/search` | `requests.get()` (synchronous) in `async def` blocks event loop; regex injection in pandas `.str.contains()` | Replace with `httpx.AsyncClient`, add `regex=False` |
| `/api/geocode/autocomplete` | Same sync `requests` issue + `data_loader.get_gdf("suburbs")` may fail on first load | Add error handling, lazy load |
| `/api/reports/dashboard-data` | `import geopandas` at module level crashes if not installed; iterates ALL datasets | Make geopandas import lazy, add per-dataset try/catch (already has it but may still fail) |

### 2. React Infinite Loops

| Component | Root Cause | Fix |
|-----------|-----------|-----|
| `useUrlState.ts` | `searchParams` object reference in `useEffect` deps triggers on every URL change → effect re-runs | Remove `searchParams` from deps, use ref-based comparison |
| `App.tsx:handleScenarioLoad` | Captures `urlState` in closure → stale state on rapid calls | Use functional updater `setUrlState(prev => ...)` |
| `OpsStatus.tsx` | Health check failure causes re-render → no issue found (uses `[]` deps) | Add error boundary wrapper |
| `Dashboard.tsx` | Recursive `setTimeout` retry pattern is fragile | Already has `useCallback` with `[]` — structurally sound |

### 3. MapView Layer Issues

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| PostGIS clusters not visible | `usePostGISClusters` hook imported but never called in MapView | Wire hook into MapView, render ClusterLayer |
| Polygons not displaying | Data layers use `Date.now()` keys → constant remounting | Replace with stable keys based on data hash |
| Markers missing | Same `Date.now()` key issue | Use stable keys |
| Heatmap not working | Only renders for `moduleLayer?.type === 'heatmap'` — not for general data | Add heatmap toggle for any point layers |
| Routes not showing | Route layer works but uses `Date.now()` key | Use stable key |
| ClusterLayer badge invisible | `<div>` inside `<CircleMarker>` is invalid in Leaflet (SVG renderer) | Use Tooltip or DivIcon approach |

### 4. Network ERR_CONNECTION_RESET

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| 30+ connection resets | Backend not running or connection pool exhausted | Ensure backend health, add connection pooling config |
| Static file 404s | Frontend build output may be stale | Rebuild frontend, verify `static/` directory |

### 5. PostGIS Performance

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Clustering > 1000ms | No GiST indexes, f-string SQL (injection risk) | Add indexes, parameterized queries |
| No spatial indexes | Missing CREATE INDEX statements | Add migration with GiST indexes |

---

## Patch Generation Plan

### Phase 2: API Fixes (patches 003-008)
- 003: Fix /api/health non-blocking
- 004: Fix data-status endpoints error handling
- 005: Fix geocode async + regex safety
- 006: Fix reports dashboard-data lazy imports
- 007: Add eval-log route alias
- 008: Enhanced global error handling

### Phase 3: React Fixes (patches 010-013)
- 010: Fix useUrlState infinite loop
- 011: Fix App.tsx stale closure
- 012: Add error boundary for OpsStatus
- 013: Dashboard abort controller cleanup

### Phase 4: MapView Layers (patches 015-022)
- 015: Remove Date.now() keys, use stable keys
- 016: Wire PostGIS clusters into MapView
- 017: Fix ClusterLayer badge rendering
- 018: Improve useMapLayers fallback logic
- 019: Add heatmap support for data layers
- 020: Fix route/isochrone layer keys
- 021: Layer control improvements
- 022: Zoom-dependent layer switching

### Phase 5: Network (patches 024-027)
- 024: Vite proxy validation
- 025: Backend connection pool tuning
- 026: Request timeout configuration
- 027: Static file serving verification

### Phase 6: PostGIS (patches 028-032)
- 028: Add GiST spatial indexes
- 029: Fix SQL injection in get_clustered_points
- 030: Add geometry simplification
- 031: Implement query result caching
- 032: Connection pool optimization
