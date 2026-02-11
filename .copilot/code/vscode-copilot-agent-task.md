# VS Code GitHub Copilot Agent Mode Task
# Cape Town GeoHub - MapView Integration & API Gateway Fixes

**Agent Framework**: SUPER-AGENT v3 (SAFE_MODE enabled)  
**Model**: Claude Opus 4.6 (via GitHub Copilot)  
**Mode**: Long-running autonomous agent task  
**Trace ID**: `trace-mapview-fix-001`  
**Date**: 2026-02-10  
**Priority**: P0 (Critical)

---

## 🎯 AGENT MODE PROTOCOL

### Pre-Flight Checks (MANDATORY)

Before starting, the agent MUST:

```bash
# 1. Load agent infrastructure context
@workspace /explain .github/AGENTS.md
@workspace /explain .github/copilot-instructions.md
@workspace /explain .github/agent-manifest.json

# 2. Review active skills
@workspace /explain .github/skills/*/SKILL.md

# 3. Check policies
@workspace /explain .github/policies/

# 4. Initialize memory session
node .github/hooks/BeforeAgent.js << EOF_JSON
{
  "agent_id": "copilot-mapview-task",
  "task": "MapView data layer integration and API Gateway fixes",
  "trace_id": "trace-mapview-fix-001",
  "safe_mode": true,
  "max_iterations": 50,
  "expected_duration_minutes": 180
}
EOF_JSON
```

### Agent Constraints (SUPER-AGENT v3 Framework)

**SAFE_MODE = true** (ENFORCED)
- ✅ **Allowed**: Writes to `.github/` only
- ❌ **Forbidden**: Direct writes to `app/`, `frontend/`, `backend/`, `tests/`
- ✅ **Required**: Generate patches under `.github/patches/` for code changes
- ✅ **Required**: All changes logged to `.github/hooks/audit.log`

**Hook Lifecycle (MANDATORY)**
```
BeforeAgent → [Task Planning] → BeforeTool → [Tool Execution] → AfterTool → 
  → BeforeFileWrite → [File Write] → AfterExecution → [Summary & Memory Update]
```

**Policy Compliance (REQUIRED)**
1. **no-secrets.yaml**: No API keys, tokens, passwords in code
2. **dependency-allowlist.yaml**: Only approved licenses (MIT, Apache-2.0, BSD)
3. **max-pr-size.yaml**: Changes ≤ 500 lines, ≤ 20 files (except migrations)
4. **protected-files.yaml**: No direct edits to AGENTS.md, workflows, requirements.txt

---

## 📋 PRIMARY MISSION OBJECTIVES

### Objective 1: Fix All API Gateway Errors
**Target**: All API endpoints return 200 OK, zero 500 errors

**Failing Endpoints**:
```yaml
- /api/health                          # 500 Internal Server Error
- /api/data-status/health              # 500 Internal Server Error  
- /api/data-status/eval-log?limit=20   # 500 Internal Server Error
- /api/geocode/search?q=*              # 500 Internal Server Error
- /api/geocode/autocomplete?q=*        # 500 Internal Server Error
- /api/reports/dashboard-data          # 500 Internal Server Error
```

**Root Cause Analysis Required**:
1. Database connection pool status
2. PostGIS extension availability
3. Middleware/CORS configuration
4. Error handling in route handlers
5. Environment variable validation

### Objective 2: Fix React Component Infinite Loops
**Target**: Zero "Maximum update depth exceeded" errors

**Affected Components**:
```typescript
// App.tsx:105 - Maximum update depth exceeded
// OpsStatus.tsx:36 - Health check failed
// Dashboard.tsx:82 - Dashboard load error
```

**Fix Strategy**:
- Audit all `useEffect` hooks for missing dependencies
- Implement proper cleanup functions
- Add mounted state tracking
- Implement error boundaries
- Add request cancellation for aborted fetches

### Objective 3: Enable All MapView Data Layers
**Target**: All layers visible with detailed UI rendering

**Required Layers**:
```typescript
interface MapViewLayers {
  postgis_clusters: {
    enabled: boolean;           // ← Must be true
    clusterRadius: number;      // ← Default: 50px
    minZoom: number;            // ← Default: 0
    maxZoom: number;            // ← Default: 18
  };
  polygons: {
    enabled: boolean;           // ← Must be true
    fillOpacity: number;        // ← 0.3-0.5
    strokeWidth: number;        // ← 2px
    interactive: boolean;       // ← true
  };
  markers: {
    enabled: boolean;           // ← Must be true
    iconSize: [number, number]; // ← [32, 32]
    clustering: boolean;        // ← true
  };
  heatmaps: {
    enabled: boolean;           // ← Must be true
    radius: number;             // ← 25
    blur: number;               // ← 15
    gradient: Record<number, string>;
  };
  routes: {
    enabled: boolean;           // ← Must be true
    weight: number;             // ← 4px
    opacity: number;            // ← 0.8
  };
}
```

### Objective 4: Fix Network Connection Errors
**Target**: Zero ERR_CONNECTION_RESET errors

**Error Pattern**:
```
Failed to load resource: net::ERR_CONNECTION_RESET
- Resources: 1125, 1126, 1127, 1128, 1129, 1130, 1131
- Static files: 34, 35
```

**Investigation Required**:
1. Network proxy/middleware configuration
2. CORS headers
3. Resource bundling/chunking
4. CDN/static file serving
5. Request timeout settings

### Objective 5: Optimize PostGIS Clustering
**Target**: Query latency < 300ms at p95

**Performance Requirements**:
```sql
-- Clustering query optimization targets
- ST_ClusterDBSCAN: < 200ms
- ST_Intersection: < 150ms  
- Geometry simplification: < 50ms
- Index usage: MUST use GiST indexes
```

---

## 🛠️ AGENT EXECUTION WORKFLOW

### Phase 1: Infrastructure Analysis (15 min)

**Agent Instructions**:
```
@workspace Analyze the following files and create execution plan:
- /api/** (all API route handlers)
- /frontend/src/components/App.tsx
- /frontend/src/components/OpsStatus.tsx  
- /frontend/src/components/Dashboard.tsx
- /frontend/src/components/MapView.tsx (or equivalent)
- /backend/config/** (database, API gateway configs)
- /.env.example
- /docker-compose.yml
```

**Deliverable**: 
- `.github/patches/001-execution-plan.md` (analysis + plan)
- `.github/findings.json` (initial findings)

**Validation Hook**:
```bash
echo '{
  "phase": "analysis",
  "files_analyzed": ["app/api/*", "frontend/src/*"],
  "findings_count": 12
}' | node .github/hooks/AfterTool.js
```

### Phase 2: API Gateway Fixes (45 min)

**Skills to Invoke**:
```yaml
skill: api-adapter
action: diagnose_api_failures
parameters:
  endpoints: ["/api/health", "/api/data-status/health", ...]
  log_level: "debug"
  output: ".github/patches/002-api-diagnostics.json"

skill: dep-guardian
action: check_database_dependencies
parameters:
  databases: ["postgresql", "postgis"]
  verify_connections: true
```

**Required Patches** (generate under `.github/patches/`):
```
003-api-health-fix.patch         # Fix /api/health endpoint
004-data-status-fix.patch        # Fix /api/data-status/*
005-geocode-fix.patch            # Fix /api/geocode/*
006-dashboard-api-fix.patch      # Fix /api/reports/dashboard-data
007-middleware-cors.patch        # CORS/middleware configuration
008-error-handling.patch         # Global error handler
```

**Validation**:
```bash
# Before applying patches, validate
@terminal curl -v http://localhost:5174/api/health

# After generating patches
@workspace Review .github/patches/003-api-health-fix.patch
@workspace Run .github/skills/api-adapter/scripts/test_endpoints.sh
```

**Policy Check**:
```bash
# Ensure no secrets in patches
node .github/scripts/policy_check.js --policy=no-secrets \
  --files=".github/patches/*.patch"

# Ensure dependencies allowed
node .github/scripts/policy_check.js --policy=dependency-allowlist \
  --check-imports
```

### Phase 3: React Component Fixes (30 min)

**Skills to Invoke**:
```yaml
skill: refactor-strategist  
action: analyze_component_rerender
parameters:
  components: ["App.tsx", "OpsStatus.tsx", "Dashboard.tsx"]
  detect_patterns: ["infinite_loop", "missing_deps", "memory_leak"]
  output: ".github/patches/009-react-analysis.json"

skill: design-linter
action: validate_component_patterns
parameters:
  rules: ["hooks-deps", "cleanup-functions", "error-boundaries"]
```

**Required Patches**:
```
010-app-tsx-useeffect-fix.patch       # Fix App.tsx infinite loop
011-opsstatus-error-boundary.patch    # Add error boundary
012-dashboard-loading-state.patch     # Add proper loading states
013-abort-controller.patch            # Request cancellation
```

**Validation**:
```bash
# Run frontend type check
@terminal cd frontend && npm run type-check

# Run linter
@terminal cd frontend && npm run lint

# Test components
@terminal cd frontend && npm test -- App.test.tsx
```

### Phase 4: MapView Layer Integration (60 min)

**Skills to Invoke**:
```yaml
skill: ui-crawler
action: map_component_structure
parameters:
  component: "MapView"
  extract_props: true
  identify_layers: true

skill: api-adapter  
action: generate_map_layer_types
parameters:
  api_endpoint: "/api/map/layers"
  output_path: ".github/patches/014-layer-types.ts"
```

**Required Patches**:
```
015-mapview-config.patch         # Enable all layers
016-postgis-cluster-layer.patch  # PostGIS clustering
017-polygon-layer.patch          # Polygon rendering
018-marker-layer.patch           # Marker/pin layer
019-heatmap-layer.patch          # Heatmap overlay
020-route-layer.patch            # Route/path layer
021-layer-controls.patch         # Layer toggle UI
022-zoom-level-layers.patch      # Zoom-dependent layer switching
```

**Performance Validation**:
```typescript
// .github/patches/023-performance-test.ts
// Expected: < 200ms tile loading, < 300ms PostGIS queries
import { testMapPerformance } from './utils/perf';

const results = await testMapPerformance({
  layers: ['clusters', 'polygons', 'markers', 'heatmaps'],
  zoom: 12,
  viewport: { lat: -33.9, lng: 18.4, width: 1920, height: 1080 }
});

assert(results.tileLoadTime < 200, 'Tile loading too slow');
assert(results.postgisQueryTime < 300, 'PostGIS queries too slow');
```

### Phase 5: Network Error Resolution (20 min)

**Diagnostic Commands**:
```bash
@terminal # Check network configuration
curl -v http://localhost:5174/1126 2>&1 | tee .github/patches/network-debug.log

@terminal # Test static file serving  
ls -la frontend/dist/ | grep -E "(1125|1126|1127|1128)"

@terminal # Check Vite/Webpack configuration
cat frontend/vite.config.ts
```

**Required Patches**:
```
024-static-file-config.patch     # Fix static file serving
025-chunking-config.patch        # Fix bundle chunking
026-proxy-middleware.patch       # Fix proxy configuration
027-timeout-config.patch         # Adjust request timeouts
```

### Phase 6: PostGIS Optimization (30 min)

**Skills to Invoke**:
```yaml
skill: api-adapter
action: optimize_postgis_queries
parameters:
  query_patterns: ["ST_ClusterDBSCAN", "ST_Intersection", "ST_SimplifyPreserveTopology"]
  target_latency_ms: 300
  enable_indexes: true
```

**Required Patches**:
```
028-postgis-indexes.patch        # Add/optimize GiST indexes
029-cluster-query-opt.patch      # Optimize clustering algorithm
030-geometry-simplify.patch      # Add geometry simplification
031-query-caching.patch          # Implement query result caching
032-connection-pool.patch        # Optimize connection pooling
```

**Validation SQL**:
```sql
-- .github/patches/033-postgis-validation.sql
EXPLAIN ANALYZE
SELECT ST_ClusterDBSCAN(geom, 0.001, 1) OVER () AS cluster_id, *
FROM geo_points
WHERE ST_Within(geom, ST_MakeEnvelope(18.3, -34.0, 18.5, -33.8, 4326));

-- Expected: Execution time < 300ms, Index Scan (not Seq Scan)
```

### Phase 7: Integration Testing (30 min)

**Test Suites to Run**:
```bash
# Backend tests
@terminal cd backend && pytest tests/api/test_health.py -v
@terminal cd backend && pytest tests/api/test_geocode.py -v  
@terminal cd backend && pytest tests/api/test_reports.py -v

# Frontend tests
@terminal cd frontend && npm test -- --coverage

# E2E tests (if available)
@terminal npm run test:e2e

# Performance tests
@terminal node .github/patches/023-performance-test.ts
```

**Skills to Invoke**:
```yaml
skill: accessibility-auditor
action: audit_mapview_a11y
parameters:
  url: "http://localhost:5174"
  wcag_level: "AA"
  output: ".github/findings.json"
```

### Phase 8: Documentation & Finalization (20 min)

**Required Documentation**:
```
.github/patches/README.md          # Patch application guide
.github/patches/ROLLBACK.md        # Rollback instructions
.github/patches/TESTING.md         # Testing procedures
.github/patches/DEPLOYMENT.md      # Deployment checklist
```

**Memory Update**:
```bash
# Update project memory
node .github/hooks/AfterExecution.js << EOF_JSON
{
  "task_id": "trace-mapview-fix-001",
  "status": "completed",
  "patches_generated": 33,
  "tests_passed": true,
  "findings": {
    "critical": 0,
    "high": 0,
    "medium": 3,
    "low": 5,
    "info": 2
  },
  "performance": {
    "api_latency_p95": "245ms",
    "postgis_latency_p95": "285ms",
    "tile_load_time": "175ms"
  }
}
EOF_JSON
```

**Findings Report**:
```bash
# Generate final findings report
node .github/scripts/policy_check.js --generate-report \
  --output=.github/findings.json
```

---

## 🎯 SUCCESS CRITERIA CHECKLIST

### API Gateway Health
- [ ] `/api/health` returns 200 OK
- [ ] `/api/data-status/health` returns 200 OK  
- [ ] `/api/data-status/eval-log` returns 200 OK
- [ ] `/api/geocode/search` returns 200 OK
- [ ] `/api/geocode/autocomplete` returns 200 OK
- [ ] `/api/reports/dashboard-data` returns 200 OK
- [ ] All responses < 500ms (p95)

### React Components
- [ ] Zero "Maximum update depth exceeded" errors
- [ ] Zero "Failed to load resource" errors
- [ ] All components render without errors
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] Request cancellation working

### MapView Layers
- [ ] PostGIS clusters visible and interactive
- [ ] Polygons rendered with correct styling
- [ ] Markers displayed with clustering
- [ ] Heatmap overlay functional
- [ ] Routes/paths rendered correctly
- [ ] Layer controls working
- [ ] Zoom-level switching active
- [ ] Tile loading < 200ms

### Network & Performance
- [ ] Zero ERR_CONNECTION_RESET errors
- [ ] All static resources loading
- [ ] No 404/500 errors in console
- [ ] Bundle size optimized
- [ ] PostGIS queries < 300ms (p95)
- [ ] Frontend load time < 3s

### Code Quality & Compliance
- [ ] All patches in `.github/patches/`
- [ ] No secrets in code (policy check passed)
- [ ] All dependencies allowed (license check passed)
- [ ] Protected files unchanged (or approved)
- [ ] PR size within limits (or migration exception)
- [ ] All hooks executed successfully
- [ ] Audit log complete

### Testing & Validation
- [ ] Backend tests passing (pytest)
- [ ] Frontend tests passing (vitest/jest)
- [ ] Type checks passing (TypeScript)
- [ ] Linter checks passing (ESLint, ruff)
- [ ] E2E tests passing (if applicable)
- [ ] Performance tests meeting SLAs
- [ ] Accessibility audit passed (WCAG AA)

### Documentation
- [ ] Patch application guide complete
- [ ] Rollback instructions documented
- [ ] Testing procedures documented
- [ ] Deployment checklist complete
- [ ] Findings report generated
- [ ] Memory updated

---

## 🔧 AGENT TOOL USAGE PATTERNS

### Using Skills

```typescript
// Invoke a skill from agent mode
@workspace /invoke-skill dep-guardian check_vulnerabilities \
  --severity=high \
  --output=.github/findings.json

// Chain skills
@workspace /invoke-skill api-adapter diagnose | \
  /invoke-skill refactor-strategist fix | \
  /invoke-skill pr-reviewer validate
```

### Using Hooks

```typescript
// Before writing any file
echo '{
  "file_path": ".github/patches/new-patch.patch",
  "operation": "write",
  "content_size": 1024
}' | node .github/hooks/BeforeFileWrite.js

// Expected: Exit 0 (allow) or Exit 2 (deny)

// After tool execution
echo '{
  "tool_name": "api-adapter",
  "status": "success",
  "output_files": [".github/patches/api-fix.patch"]
}' | node .github/hooks/AfterTool.js
```

### Policy Checks

```bash
# Check for secrets before committing patches
node .github/scripts/policy_check.js \
  --policy=no-secrets \
  --path=.github/patches/ \
  --verbose

# Validate dependency changes
node .github/scripts/policy_check.js \
  --policy=dependency-allowlist \
  --diff=git diff main..HEAD package.json
```

### Memory Updates

```typescript
// Read current session memory
const sessionMemory = JSON.parse(
  fs.readFileSync('.github/agent-memory/session_memory.json', 'utf8')
);

// Update with task progress
sessionMemory.current_task = {
  id: 'trace-mapview-fix-001',
  progress: 0.75,
  patches_generated: 25,
  phase: 'integration_testing'
};

// Write back (ALLOWED in SAFE_MODE)
fs.writeFileSync(
  '.github/agent-memory/session_memory.json',
  JSON.stringify(sessionMemory, null, 2)
);
```

---

## 🚨 ERROR HANDLING & RECOVERY

### If API Gateway Fixes Fail

**Diagnostic Steps**:
```bash
# 1. Check database connection
@terminal docker-compose logs postgres | grep -i error

# 2. Verify PostGIS extension
@terminal psql -U user -d db -c "SELECT PostGIS_version();"

# 3. Check environment variables
@terminal env | grep -E "(DATABASE|API|POSTGIS)"

# 4. Review API Gateway logs
@terminal docker-compose logs api-gateway --tail=100
```

**Fallback Strategy**:
1. Generate `.github/patches/fallback-api-minimal.patch` (health endpoints only)
2. Isolate failing endpoints
3. Add graceful degradation
4. Document known issues in findings

### If React Infinite Loops Persist

**Diagnostic Steps**:
```typescript
// Add debug logging to useEffect
useEffect(() => {
  console.log('[DEBUG] useEffect triggered', { deps });
  // ... existing code
}, [deps]);

// Check render count
let renderCount = 0;
function ComponentName() {
  renderCount++;
  console.log('[DEBUG] Render count:', renderCount);
  // ...
}
```

**Fallback Strategy**:
1. Disable problematic components temporarily
2. Add feature flags
3. Generate patches with TODO comments
4. Document in findings for manual review

### If MapView Layers Don't Render

**Diagnostic Steps**:
```bash
# 1. Check API responses
@terminal curl http://localhost:5174/api/map/layers | jq

# 2. Verify GeoJSON format
@terminal curl http://localhost:5174/api/map/clusters | jq '.features[0]'

# 3. Check browser console
# Open DevTools → Console → Look for map initialization errors

# 4. Verify Mapbox/Leaflet version
@terminal cd frontend && npm list mapbox-gl leaflet
```

**Fallback Strategy**:
1. Enable layers one by one
2. Start with simplest layer (markers)
3. Add progressive enhancement
4. Generate patches for each layer separately

### If Performance Targets Not Met

**Optimization Strategy**:
```sql
-- 1. Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_geo_points_geom
  ON geo_points USING GIST (geom);

-- 2. Enable query parallelism
SET max_parallel_workers_per_gather = 4;

-- 3. Increase work memory
SET work_mem = '256MB';

-- 4. Use geometry simplification
SELECT ST_SimplifyPreserveTopology(geom, 0.0001) AS simplified_geom
FROM geo_points;
```

**Fallback Strategy**:
1. Implement pagination for large datasets
2. Add client-side clustering fallback
3. Use cached/materialized views
4. Document performance limitations in findings

---

## 📊 MONITORING & OBSERVABILITY

### Real-Time Progress Tracking

```bash
# Watch audit log for hook decisions
tail -f .github/hooks/audit.log | jq

# Monitor findings accumulation
watch -n 5 'jq ".summary" .github/findings.json'

# Track patch generation
ls -lt .github/patches/ | head -20

# Watch memory updates
watch -n 10 'jq ".current_task" .github/agent-memory/session_memory.json'
```

### Health Checks During Execution

```bash
# Every 15 minutes, verify:
@terminal curl -s http://localhost:5174/api/health | jq
@terminal curl -s http://localhost:5174/api/data-status/health | jq

# Check database connectivity
@terminal psql -U user -d db -c "SELECT 1;" || echo "DB CONNECTION FAILED"

# Monitor resource usage
@terminal docker stats --no-stream
```

### Incremental Validation

```bash
# After each phase, run quick validation
bash .github/scripts/verify.sh --quick

# After generating patches, verify
git apply --check .github/patches/*.patch

# Before finalization, full validation
bash .github/scripts/verify.sh --full
```

---

## 🎓 COPILOT-SPECIFIC INSTRUCTIONS

### Workspace Context Commands

```typescript
// Load all relevant files into context
@workspace /loadFiles app/api/health.ts
@workspace /loadFiles frontend/src/components/MapView.tsx
@workspace /loadFiles .github/AGENTS.md
@workspace /loadFiles .github/copilot-instructions.md

// Search for patterns
@workspace /search "useEffect" --include="frontend/src/**/*.tsx"
@workspace /search "ERR_CONNECTION_RESET" --include="**/*.log"
@workspace /search "ST_ClusterDBSCAN" --include="backend/**/*.sql"
```

### Agent Chat Patterns

```
User: @workspace Analyze all API endpoints and generate fix patches

Agent: I'll analyze the API endpoints following SUPER-AGENT v3 protocol:

1. Loading context from .github/AGENTS.md and copilot-instructions.md
2. Invoking BeforeAgent hook to initialize session
3. Using api-adapter skill to diagnose failures
4. Generating patches under .github/patches/
5. Running policy checks
6. Invoking AfterExecution hook to update memory

[Proceeds with execution]
```

### Iterative Refinement

```
User: @workspace The PostGIS clustering is still slow, optimize further

Agent: I'll optimize PostGIS clustering with additional strategies:

1. Reviewing .github/agent-memory/session_memory.json for previous attempts
2. Analyzing query execution plans
3. Testing ST_ClusterKMeans as alternative to DBSCAN
4. Implementing spatial partitioning
5. Generating .github/patches/034-postgis-advanced-opt.patch

[Proceeds with optimization]
```

---

## 🔄 ITERATIVE IMPROVEMENT PROTOCOL

### Iteration 1: Quick Wins (30 min)
- Fix health endpoints
- Add error boundaries
- Enable basic map layers
- **Goal**: Reduce critical errors by 80%

### Iteration 2: Core Functionality (60 min)
- Fix all API endpoints
- Resolve infinite loops
- Enable all map layers
- **Goal**: All core features working

### Iteration 3: Optimization (45 min)
- Optimize PostGIS queries
- Improve tile loading
- Add caching
- **Goal**: Meet performance SLAs

### Iteration 4: Polish (25 min)
- Add loading states
- Improve error messages
- Add accessibility
- **Goal**: Production-ready quality

### Iteration 5: Documentation (20 min)
- Generate all documentation
- Update memory
- Create deployment guide
- **Goal**: Complete deliverables

---

## ✅ FINAL DELIVERABLES

### Patches Directory Structure

```
.github/patches/
├── README.md                    # How to apply patches
├── ROLLBACK.md                  # Rollback instructions
├── TESTING.md                   # Testing procedures  
├── DEPLOYMENT.md                # Deployment checklist
├── 001-execution-plan.md        # Initial analysis
├── 002-api-diagnostics.json     # API diagnostic results
├── 003-033-*.patch              # All fix patches (33 total)
└── 034-*.patch                  # Any additional optimizations
```

### Findings Report

```json
// .github/findings.json (updated)
{
  "findings": [
    {
      "id": "f-0002",
      "severity": "critical",
      "category": "api",
      "title": "API Gateway 500 errors on 6 endpoints",
      "status": "resolved",
      "patch": ".github/patches/003-008-*.patch"
    },
    // ... all findings
  ],
  "summary": {
    "total_findings": 15,
    "resolved": 12,
    "in_progress": 3,
    "by_severity": {
      "critical": 0,
      "high": 0,
      "medium": 3,
      "low": 0
    }
  }
}
```

### Memory State

```json
// .github/agent-memory/session_memory.json (final)
{
  "session_id": "trace-mapview-fix-001",
  "agent_id": "copilot-mapview-task",
  "status": "completed",
  "started_at": "2026-02-10T10:00:00Z",
  "completed_at": "2026-02-10T13:00:00Z",
  "duration_minutes": 180,
  "iterations": 5,
  "patches_generated": 34,
  "skills_invoked": ["api-adapter", "dep-guardian", "refactor-strategist", "ui-crawler", "accessibility-auditor"],
  "hooks_executed": 156,
  "policy_violations": 0,
  "tests_passed": true,
  "performance_sla_met": true,
  "safe_mode_violations": 0
}
```

### Audit Trail

```jsonl
// .github/hooks/audit.log (sample entries)
{"timestamp":"2026-02-10T10:05:00Z","hook":"BeforeAgent","decision":"allow","trace_id":"trace-mapview-fix-001"}
{"timestamp":"2026-02-10T10:15:00Z","hook":"BeforeTool","tool":"api-adapter","decision":"allow","violations":[]}
{"timestamp":"2026-02-10T12:30:00Z","hook":"BeforeFileWrite","file":".github/patches/025-*.patch","decision":"allow"}
{"timestamp":"2026-02-10T13:00:00Z","hook":"AfterExecution","status":"completed","findings_count":15,"patches":34}
```

---

## 🎉 COMPLETION CHECKLIST

Before marking task as complete:

- [ ] All 6 API endpoints returning 200 OK
- [ ] Zero React infinite loop errors
- [ ] All 5 MapView layers visible and functional
- [ ] Zero ERR_CONNECTION_RESET errors
- [ ] PostGIS queries < 300ms
- [ ] All tests passing (backend + frontend)
- [ ] All patches generated under `.github/patches/`
- [ ] No SAFE_MODE violations (audit log clean)
- [ ] All policies passed (no-secrets, dependency-allowlist, etc.)
- [ ] Findings report complete
- [ ] Memory updated
- [ ] Documentation complete (README, ROLLBACK, TESTING, DEPLOYMENT)
- [ ] Audit log complete
- [ ] Ready for PR/review

---

## 🚀 NEXT STEPS AFTER COMPLETION

### 1. Review Generated Patches

```bash
# List all patches
ls -lh .github/patches/

# Read patch application guide
cat .github/patches/README.md

# Review each patch
for patch in .github/patches/*.patch; do
  echo "=== $patch ==="
  cat "$patch"
  echo
done
```

### 2. Apply Patches (Manual Review Required)

```bash
# Apply one patch at a time with review
git apply --check .github/patches/003-api-health-fix.patch
git apply .github/patches/003-api-health-fix.patch

# Or apply all at once (USE WITH CAUTION)
cat .github/patches/*.patch | git apply
```

### 3. Run Verification

```bash
# Full verification
bash .github/scripts/verify.sh --full

# Quick smoke test
npm run dev
curl http://localhost:5174/api/health
```

### 4. Create PR

```bash
# Create feature branch
git checkout -b fix/mapview-api-gateway-integration

# Commit patches
git add .github/patches/
git commit -m "feat: Fix MapView data layers and API Gateway

- Resolve 6 API endpoint 500 errors
- Fix React infinite loop issues
- Enable all MapView data layers
- Optimize PostGIS clustering < 300ms
- Add comprehensive error handling

Generated by: SUPER-AGENT v3 (GitHub Copilot + Claude Opus 4.6)
Trace ID: trace-mapview-fix-001

See .github/patches/README.md for patch application instructions"

# Push and create PR
git push origin fix/mapview-api-gateway-integration
gh pr create --title "Fix: MapView Integration & API Gateway" \
  --body-file .github/patches/README.md
```

### 5. Monitor CI

The `.github/workflows/agent-ci.yml` workflow will:
- Validate all patches
- Run linters and tests
- Check policies
- Generate report

---

## 📞 TROUBLESHOOTING

### Agent Not Following Protocol

**Symptom**: Agent tries to write directly to `app/` or `frontend/`

**Solution**:
```
User: @workspace STOP. Review .github/AGENTS.md SAFE_MODE constraints.
All code changes must be patches under .github/patches/
```

### Skills Not Found

**Symptom**: `skill: api-adapter not found`

**Solution**:
```bash
# Verify skills exist
ls -la .github/skills/

# Reload workspace
@workspace /reload

# Explicitly load skill
@workspace /loadFiles .github/skills/api-adapter/SKILL.md
```

### Hooks Failing

**Symptom**: Hook execution returns exit code 1 or 2

**Solution**:
```bash
# Check hook logs
cat .github/hooks/audit.log | tail -20

# Test hook manually
echo '{"test": true}' | node .github/hooks/BeforeTool.js

# Fix permissions
chmod +x .github/hooks/*.js
```

### Policy Violations

**Symptom**: Policy check fails with violations

**Solution**:
```bash
# Review violations
node .github/scripts/policy_check.js --verbose

# Fix violations manually
# Update patches to comply with policies
# Re-run policy check
```

---

**END OF AGENT TASK SPECIFICATION**

---

**Trace ID**: `trace-mapview-fix-001`  
**Framework**: SUPER-AGENT v3  
**Mode**: VS Code GitHub Copilot Agent Mode  
**Model**: Claude Opus 4.6  
**Status**: Ready for execution  
**Estimated Duration**: 180 minutes  
**Expected Patches**: 30-40  
**Safe Mode**: ENABLED ✅
