# Performance Testing and Optimization Guide

## Overview

This document describes the performance testing infrastructure, benchmarking tools, and optimization strategies for Cape Town GeoHub.

## Performance Budgets

Performance budgets are defined in `.github/performance-budget.json` and enforced in CI via the Performance Budget workflow.

### Frontend Budgets

| Metric | Warn | Fail | Description |
|--------|------|------|-------------|
| Page Load | 3000ms | 5000ms | Initial page load time |
| Map Ready | 2000ms | 4000ms | Time until map is fully interactive |
| First Layer Render | 1500ms | 3000ms | Time to render first data layer |
| Interaction Ready | 1000ms | 2000ms | Time for interactions to respond |
| Bundle Size | 1024KB | 2048KB | Main bundle size |
| Total Bundle Size | 3072KB | 5120KB | Total bundle size including chunks |

### Backend Budgets

| Metric | Warn | Fail | Description |
|--------|------|------|-------------|
| Spatial Query Avg | 100ms | 200ms | Average spatial query response time |
| Cluster Query Avg | 200ms | 500ms | Average cluster query response time |
| API Response P95 | 500ms | 1000ms | 95th percentile API response time |
| Index Coverage | 80% | 60% | Percentage of queries using indexes |
| Slow Query Count | 5 | 10 | Number of queries taking over 1 second |

## Frontend Performance Testing

### Running Performance Tests Locally

```bash
cd frontend
npm run test:perf
```

### Performance Test Structure

The performance harness (`frontend/tests/performance.spec.js`) includes:

1. **Deterministic Map Ready Detection**
   - Waits for Leaflet container
   - Checks for loaded tiles
   - Ensures zoom controls are interactive
   - Waits for network idle
   - Adds buffer for event handlers

2. **Performance Timing Measurements**
   - Navigation timing API
   - Paint timing (FP, FCP)
   - Resource timing
   - Memory usage (if available)

3. **Auth Support** (Placeholder)
   - Ready for future JWT/session cookie auth
   - Helper: `setupAuth(page)`

4. **Baseline Metrics Collection**
   - Page load performance
   - Map ready timing
   - Layer load performance
   - Interaction responsiveness
   - Map panning performance
   - Duplicate fetch detection

### Key Test Cases

- **baseline: page load performance** - Measures DOMContentLoaded, paint timing
- **baseline: map ready performance** - Measures time to interactive map
- **baseline: layer load performance** - Tracks layer request timing
- **baseline: interaction responsiveness** - Tests zoom and pan interactions
- **regression: no duplicate layer fetches** - Ensures efficient data loading

## Backend Performance Testing

### PostGIS Query Benchmarking

Use the benchmark utilities in `app/utils/benchmark.py`:

```python
from app.utils.benchmark import PostGISBenchmark
from app.core.database import get_db

async def run_benchmark():
    async for db in get_db():
        benchmark = PostGISBenchmark(db)
        
        # Run EXPLAIN ANALYZE
        result = await benchmark.explain_analyze(
            "SELECT * FROM informal_settlements WHERE ST_DWithin(...)"
        )
        
        # Check index usage
        indexes = await benchmark.check_indexes("informal_settlements")
        
        # Benchmark query performance
        timing = await benchmark.benchmark_query(query, iterations=5)
        
        # Analyze spatial query
        analysis = await benchmark.analyze_spatial_query("informal_settlements")
```

### Benchmark API Endpoints

The benchmark API (`/api/benchmark/`) provides admin endpoints:

- **POST /api/benchmark/explain** - Run EXPLAIN ANALYZE on a query
- **POST /api/benchmark/benchmark** - Benchmark query with multiple runs
- **GET /api/benchmark/indexes/{table}** - Check table indexes
- **POST /api/benchmark/analyze-spatial** - Comprehensive spatial query analysis
- **POST /api/benchmark/suite** - Run benchmark suite on multiple tables
- **GET /api/benchmark/suggest-index/{table}** - Get index creation SQL

Example request:

```bash
curl -X POST http://localhost:8000/api/benchmark/analyze-spatial \
  -H "Content-Type: application/json" \
  -d '{
    "table_name": "informal_settlements",
    "geometry_column": "geom",
    "test_lon": 18.4241,
    "test_lat": -33.9249,
    "radius_meters": 1000
  }'
```

### PostGIS Index Optimization

#### Creating Spatial Indexes

```sql
-- GiST index for spatial queries
CREATE INDEX IF NOT EXISTS table_name_geom_gist_idx
ON table_name
USING GIST (geom);

-- Analyze table after creating index
ANALYZE table_name;
```

#### Checking Index Usage

```sql
-- Check if query uses index
EXPLAIN ANALYZE
SELECT * FROM table_name
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(18.4241, -33.9249), 4326)::geography, 1000);
```

Look for:
- "Index Scan" or "Bitmap Index Scan" (good)
- "Seq Scan" (bad - not using index)

#### Index Recommendations

1. **Always index geometry columns** with GiST indexes
2. **Index frequently queried attributes** for faster filtering
3. **Use partial indexes** for common WHERE clauses
4. **Run ANALYZE** after bulk inserts to update statistics
5. **Monitor index usage** with pg_stat_user_indexes

## CI Performance Budget Workflow

The Performance Budget workflow (`.github/workflows/performance.yml`) runs on:
- Pull requests to master/develop
- Pushes to master/develop
- Manual dispatch

### Workflow Steps

1. **Frontend Performance**
   - Installs dependencies and Playwright
   - Builds frontend
   - Runs performance tests
   - Parses results and checks budgets
   - Comments on PR with metrics

2. **Backend Performance**
   - Sets up PostGIS database
   - Installs dependencies
   - Runs benchmark suite
   - Checks against budgets
   - Comments on PR with metrics

### Budget Enforcement

- **Warn Threshold**: Logs warning but allows CI to pass
- **Fail Threshold**: Fails CI check and blocks merge

Configure which metrics fail CI in `performance-budget.json`:

```json
"notifications": {
  "warnOnly": ["bundleSize"],
  "failCi": ["pageLoad", "spatialQueryAvg"]
}
```

## Optimization Strategies

### Frontend Optimization

1. **Code Splitting**
   - Lazy load route components
   - Split heavy dependencies (deck.gl, mapbox-gl)
   - Use dynamic imports for modules

2. **Map Performance**
   - Use vector tiles for large datasets
   - Enable server-side clustering
   - Implement level-of-detail rendering
   - Cache map tiles aggressively

3. **Bundle Size**
   - Tree-shake unused code
   - Minimize dependencies
   - Use production builds
   - Enable gzip/brotli compression

4. **Data Loading**
   - Implement pagination
   - Use IndexedDB for offline caching
   - Debounce/throttle map events
   - Cancel in-flight requests

### Backend Optimization

1. **Query Optimization**
   - Add spatial indexes (GiST)
   - Use ST_DWithin for radius queries
   - Prefer geography type for distance calculations
   - Add LIMIT clauses to prevent large result sets

2. **Caching**
   - Cache expensive spatial calculations
   - Use Redis for session/API caching
   - Enable HTTP cache headers
   - Implement result set caching

3. **Connection Pooling**
   - Configure appropriate pool size
   - Use async connections (asyncpg)
   - Monitor connection usage
   - Handle connection timeouts

4. **PostGIS Best Practices**
   - Use appropriate SRIDs (4326 for external, 32734 for analysis)
   - Simplify geometries when appropriate
   - Use ST_Simplify for large polygons
   - Batch operations where possible

## Monitoring and Profiling

### Frontend Profiling

Use browser DevTools:
1. Open Performance tab
2. Record a session
3. Analyze:
   - Main thread activity
   - JavaScript execution
   - Rendering performance
   - Network waterfall

### Backend Profiling

Use PostgreSQL logging:

```sql
-- Enable slow query logging
ALTER DATABASE geohub_db SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

Use Python profiling:

```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()
# ... code to profile ...
profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumtime')
stats.print_stats()
```

## Baseline Metrics

Current baseline (as of 2026-02-12):

- Page Load: 2500ms
- Map Ready: 1800ms
- Spatial Query Avg: 45ms
- Cluster Query Avg: 120ms

## Rollback Procedures

If performance degrades:

1. **Identify the commit** that introduced the regression
2. **Revert the commit** or specific changes
3. **Re-run performance tests** to verify fix
4. **Update baseline** if necessary

```bash
# Revert a commit
git revert <commit-sha>

# Run performance tests
npm run test:perf

# Check backend benchmarks
curl -X POST http://localhost:8000/api/benchmark/suite
```

## Contributing

When adding new features:

1. Run performance tests locally before committing
2. Document any performance implications
3. Add new budgets if introducing new metrics
4. Update this guide with optimization tips

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Scoring](https://web.dev/performance-scoring/)
- [PostGIS Performance Tips](https://postgis.net/docs/performance_tips.html)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
