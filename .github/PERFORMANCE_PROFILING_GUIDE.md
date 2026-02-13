# 📊 Performance Profiling Guide
**Enterprise GIS Platform - Database Query Optimization**

**Purpose**: Document performance gains from Sprint 3 index optimization (Migration 007)

**Date**: 2026-02-11

---

## 🎯 Overview

This guide provides SQL commands to profile database performance **before and after** index optimization. Use these commands to verify the **10-100x performance improvements** from Sprint 3.

---

## 🔧 Setup

### **1. Start Database**:
```bash
# From project root
docker compose up -d db

# Wait for database to be ready
docker compose logs -f db | grep "ready to accept connections"
```

### **2. Run Migrations**:
```bash
# Activate virtual environment
source .venv/bin/activate

# Run all migrations up to 006 (RLS policies)
alembic upgrade 006

# Capture baseline performance
# (Run profiling queries below and save results)

# Run index optimization migration
alembic upgrade 007

# Re-run profiling queries to compare
```

---

## 📈 Profiling Queries

### **Query 1: Point-in-Polygon (GIST Index Test)**

**Purpose**: Test spatial intersection performance with GIST index

**Before Optimization**:
```sql
-- Disable index temporarily to simulate "before"
SET enable_indexscan = OFF;
SET enable_bitmapscan = OFF;

EXPLAIN ANALYZE
SELECT COUNT(*)
FROM service_facilities sf
WHERE ST_Within(sf.geom, ST_GeomFromText('POLYGON((18.4 -33.95, 18.5 -33.95, 18.5 -34.0, 18.4 -34.0, 18.4 -33.95))', 4326));

-- Expected: Seq Scan (slow)
-- Time: ~5-15 seconds for 100k features
```

**After Optimization**:
```sql
-- Re-enable indexes
SET enable_indexscan = ON;
SET enable_bitmapscan = ON;

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT COUNT(*)
FROM service_facilities sf
WHERE ST_Within(sf.geom, ST_GeomFromText('POLYGON((18.4 -33.95, 18.5 -33.95, 18.5 -34.0, 18.4 -34.0, 18.4 -33.95))', 4326));

-- Expected: Index Scan using idx_service_facilities_geom_gist
-- Time: ~0.1-0.5 seconds (10-50x faster)
```

**Metrics to Capture**:
- Execution Time (ms)
- Planning Time (ms)
- Index Scan vs Seq Scan
- Buffers (shared hit vs read)

---

### **Query 2: Bounding Box Query (Envelope Index Test)**

**Purpose**: Test extent queries with bounding box index

**Query**:
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id, name, ST_AsGeoJSON(geom) as geometry
FROM suburbs
WHERE geom && ST_MakeEnvelope(18.4, -34.0, 18.6, -33.8, 4326)
LIMIT 1000;

-- Expected with optimization:
-- - Bitmap Index Scan on idx_suburbs_geom_bbox
-- - Execution time: < 100ms for 500k features
```

**Performance Target**:
- **Before**: 5-10 seconds (Seq Scan)
- **After**: 50-100ms (Index Scan)
- **Improvement**: **50-100x**

---

### **Query 3: Tenant-Filtered Spatial Query (Composite Index Test)**

**Purpose**: Test composite index (tenant_id + geometry)

**Query**:
```sql
-- Set tenant context (simulates RLS session variable)
SET app.current_tenant_id = '1';
SET app.current_user_role = 'editor';

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT id, name, ST_AsGeoJSON(geom) as geometry
FROM spatial_layers
WHERE tenant_id = 1
  AND geom && ST_MakeEnvelope(18.4, -34.0, 18.6, -33.8, 4326)
  AND visibility = true
LIMIT 100;

-- Expected with optimization:
-- - Index Scan using idx_spatial_layers_tenant_geom (composite GIST)
-- - OR Bitmap Index Scan on idx_spatial_layers_visible (partial index)
-- - Execution time: < 50ms
```

**Performance Target**:
- **Before**: 2-5 seconds
- **After**: 20-50ms
- **Improvement**: **20-100x**

---

### **Query 4: Spatial Join (Composite Index Test)**

**Purpose**: Test performance of spatial joins with indexes

**Query**:
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    s.id as suburb_id,
    s.name as suburb_name,
    COUNT(sf.id) as facility_count
FROM suburbs s
LEFT JOIN service_facilities sf ON ST_Contains(s.geom, sf.geom)
WHERE s.tenant_id = 1
  AND sf.tenant_id = 1
GROUP BY s.id, s.name
ORDER BY facility_count DESC
LIMIT 20;

-- Expected with optimization:
-- - Nested Loop with Index Scan on both tables
-- - Execution time: < 1 second for 10k × 10k join
```

**Performance Target**:
- **Before**: 60-120 seconds (Nested Loop Seq Scan)
- **After**: 0.5-5 seconds (Nested Loop Index Scan)
- **Improvement**: **20-100x**

---

### **Query 5: K-Nearest Neighbor (KNN with GIST)**

**Purpose**: Test nearest neighbor queries with GIST index

**Query**:
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    id,
    name,
    ST_Distance(
        geom::geography,
        ST_SetSRID(ST_MakePoint(18.4241, -33.9249), 4326)::geography
    ) as distance_meters
FROM service_facilities
WHERE tenant_id = 1
ORDER BY geom <-> ST_SetSRID(ST_MakePoint(18.4241, -33.9249), 4326)
LIMIT 10;

-- Expected with optimization:
-- - Index Scan using idx_service_facilities_geom_gist (KNN with <->)
-- - Execution time: < 100ms
```

**Performance Target**:
- **Before**: 5-15 seconds (Sort on Seq Scan)
- **After**: 50-200ms (Index Scan with KNN)
- **Improvement**: **10-50x**

---

## 📊 Performance Metrics Table

### **Profiling Results Template**

| Query Type | Before (ms) | After (ms) | Improvement | Index Used |
|------------|-------------|------------|-------------|------------|
| Point-in-Polygon (100k features) | 5,000-15,000 | 100-500 | **30-150x** | `idx_..._geom_gist` |
| Bounding Box (500k features) | 5,000-10,000 | 50-100 | **50-200x** | `idx_..._geom_bbox` |
| Tenant + Spatial (10k features) | 2,000-5,000 | 20-100 | **20-250x** | `idx_..._tenant_geom` |
| Spatial Join (10k × 10k) | 60,000-120,000 | 500-5,000 | **12-240x** | Composite indexes |
| K-Nearest Neighbor (k=10) | 5,000-15,000 | 50-200 | **25-300x** | `idx_..._geom_gist` (KNN) |
| Visible Records Only | 1,000-3,000 | 10-50 | **20-300x** | `idx_..._visible` (partial) |

**Average Improvement**: **50-100x faster**

---

## 🔍 Index Verification Commands

### **1. Check Index Existence**:
```sql
-- List all spatial indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%gist%'
ORDER BY tablename, indexname;
```

### **2. Check Index Usage Statistics**:
```sql
-- Show index usage stats
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,  -- Number of index scans
    idx_tup_read,  -- Tuples read by index scans
    idx_tup_fetch,  -- Tuples fetched by index scans
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%gist%'
ORDER BY idx_scan DESC;
```

### **3. Check Index Bloat**:
```sql
-- Estimate index bloat (requires pgstattuple extension)
-- CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    round(100.0 * pg_relation_size(indexrelid) / NULLIF(pg_total_relation_size(relid), 0), 2) as pct_of_table
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

### **4. Analyze Table Statistics**:
```sql
-- Update statistics for query planner
ANALYZE suburbs;
ANALYZE service_facilities;
ANALYZE spatial_layers;

-- Check when table was last analyzed
SELECT
    schemaname,
    relname,
    last_analyze,
    last_autoanalyze,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

---

## 🧪 Load Testing Commands

### **1. Generate Test Data** (if needed):
```sql
-- Insert 100k test points for service_facilities
INSERT INTO service_facilities (tenant_id, name, type, geom, status)
SELECT
    1 as tenant_id,
    'Test Facility ' || generate_series as name,
    'test' as type,
    ST_SetSRID(
        ST_MakePoint(
            18.0 + random() * 0.8,  -- lng: 18.0 to 18.8
            -34.0 + random() * 0.5   -- lat: -34.0 to -33.5
        ),
        4326
    ) as geom,
    'active' as status
FROM generate_series(1, 100000);

-- Update table statistics
ANALYZE service_facilities;
```

### **2. Concurrent Query Test** (using pgbench):
```bash
# Create test file: spatial_query.sql
cat > spatial_query.sql <<'EOF'
SELECT COUNT(*)
FROM service_facilities
WHERE tenant_id = 1
  AND geom && ST_MakeEnvelope(18.4, -34.0, 18.6, -33.8, 4326);
EOF

# Run 100 concurrent queries
pgbench -h localhost -U geohub -d geohub_db \
  -f spatial_query.sql \
  -c 10 \
  -j 2 \
  -t 10

# Expected with optimization:
# - Transactions per second (TPS): > 100
# - Average latency: < 100ms
```

---

## 📝 Profiling Checklist

### **Before Migration 007**:
- [ ] Run all 5 profiling queries with indexes disabled
- [ ] Capture execution times (in milliseconds)
- [ ] Save EXPLAIN ANALYZE output to files
- [ ] Document baseline TPS for concurrent load test

### **After Migration 007**:
- [ ] Verify all 25 indexes were created successfully
- [ ] Run all 5 profiling queries with indexes enabled
- [ ] Capture improved execution times
- [ ] Calculate improvement ratios (Before / After)
- [ ] Run concurrent load test and compare TPS
- [ ] Check index usage statistics

### **Documentation**:
- [ ] Update `.github/SPRINT_3_PROGRESS.md` with real performance numbers
- [ ] Create performance comparison table
- [ ] Document any queries that didn't improve as expected
- [ ] Identify candidates for further optimization

---

## 🚀 Expected Performance Gains

### **Query Performance**:
| Metric | Target |
|--------|--------|
| **Point-in-Polygon** | < 500ms for 100k features |
| **Bounding Box** | < 100ms for 500k features |
| **K-Nearest Neighbor** | < 200ms for 100k features |
| **Spatial Join** | < 5s for 10k × 10k |
| **Tenant Filter** | < 50ms for 10k features |

### **Throughput**:
| Metric | Target |
|--------|--------|
| **Concurrent Queries (TPS)** | > 100 TPS |
| **Average Latency** | < 100ms |
| **95th Percentile** | < 500ms |

### **Resource Usage**:
| Metric | Limit |
|--------|-------|
| **Index Size** | < 300MB for typical dataset |
| **Query Memory** | < 100MB per query |
| **Shared Buffers Hit Rate** | > 95% |

---

## 🎯 Success Criteria

**Migration 007 is successful if**:
✅ All 25 indexes created without errors
✅ Query performance improved by **at least 10x**
✅ No queries regressed in performance
✅ Index usage statistics show indexes are being used
✅ Database size increased by < 500MB

**If targets not met**:
- Run `VACUUM ANALYZE` on all tables
- Check for index bloat
- Verify query planner is using indexes (`EXPLAIN` shows Index Scan)
- Consider increasing `shared_buffers` and `effective_cache_size`

---

## 📚 References

- **PostgreSQL EXPLAIN**: https://www.postgresql.org/docs/current/sql-explain.html
- **PostGIS Performance Tips**: https://postgis.net/docs/performance_tips.html
- **Index Types**: https://www.postgresql.org/docs/current/indexes-types.html

---

**Last Updated**: 2026-02-11
**Sprint**: Sprint 3 - Phase D.3.1
**Migration**: 007_optimize_spatial_indexes.py
