# Claude Code Agentic Task: MapView Data Layer Integration & API Gateway Fixes

**Model**: `claude-opus-4-6`  
**Thinking Mode**: Adaptive (effort: high)  
**Agent Teams**: Enabled (if available)

---

## 🎯 PRIMARY OBJECTIVES

1. **Enable ALL data layers** for MapView with complete API data consumption
2. **Render detailed UI elements** (points, polygons, markers, clusters) on the map
3. **Fix all connection/API errors** preventing data display
4. **Ensure zero breaking changes** to existing functionality
5. **Validate PostGIS clustering** and API Gateway health

---

## 🔍 CURRENT CRITICAL ISSUES

### Network & Connection Errors
```
ERR_CONNECTION_RESET on resources:
- 1125, 1126, 1127, 1128, 1129, 1130, 1131
- Files 34, 35
```

### API Gateway Failures (500 Errors)
```
❌ /api/data-status/health
❌ /api/data-status/eval-log?limit=20
❌ /api/health
❌ /api/geocode/search?q=woodstock&limit=10
❌ /api/geocode/autocomplete?q=woodstock&limit=8
❌ /api/reports/dashboard-data
```

### React Component Issues
```javascript
App.tsx:105 - Maximum update depth exceeded
// Likely caused by:
// - useEffect without proper dependency array
// - setState triggering re-renders infinitely
// - Missing cleanup functions
```

### Component-Specific Errors
- **OpsStatus.tsx:36** - Health check failed
- **Dashboard.tsx:82** - Dashboard load error

---

## 📋 TECHNICAL REQUIREMENTS

### 1. MapView Data Layer Architecture

**Required Layers to Enable:**
- [ ] PostGIS point clusters
- [ ] Polygon boundaries (administrative/custom)
- [ ] Heatmap overlays
- [ ] Marker/pin layers
- [ ] Route/path layers
- [ ] GeoJSON feature collections
- [ ] Real-time data streams (if applicable)

**Frontend Integration:**
```typescript
// Expected MapView configuration
interface MapViewConfig {
  layers: {
    postgis_clusters: boolean;
    polygons: boolean;
    markers: boolean;
    heatmaps: boolean;
    routes: boolean;
  };
  rendering: {
    clusterRadius: number;
    minZoom: number;
    maxZoom: number;
    style: 'detailed' | 'simplified';
  };
  api: {
    endpoint: string;
    polling: boolean;
    refreshInterval: number;
  };
}
```

### 2. API Gateway Health Requirements

**Must Pass:**
- [ ] Primary health endpoint (`/api/health`)
- [ ] Data status monitoring (`/api/data-status/health`)
- [ ] PostGIS connection validation
- [ ] Geocoding service availability
- [ ] Dashboard data aggregation

**Expected Response Structure:**
```json
{
  "status": "healthy",
  "services": {
    "postgis": { "connected": true, "latency_ms": 45 },
    "api_gateway": { "status": "ok", "version": "1.0.0" },
    "geocoding": { "available": true, "provider": "nominatim/google" }
  },
  "timestamp": "2026-02-10T12:00:00Z"
}
```

### 3. React Component Fix Strategy

**App.tsx - Maximum Update Depth:**
```typescript
// FIX PATTERN:
useEffect(() => {
  let mounted = true;
  
  async function fetchData() {
    if (!mounted) return;
    // ... fetch logic
  }
  
  fetchData();
  
  return () => { mounted = false; };
}, [/* proper dependencies */]);
```

**OpsStatus.tsx - Health Check:**
- Implement exponential backoff retry
- Add error boundaries
- Cache successful responses
- Graceful degradation on failure

**Dashboard.tsx - Data Loading:**
- Add loading states
- Implement skeleton UI
- Handle partial data scenarios
- Add comprehensive error handling

---

## 🛠️ DEBUGGING PROTOCOL

### Phase 1: API Gateway Investigation (Agent 1)
```bash
# 1. Check API Gateway logs
# 2. Verify PostGIS connection strings
# 3. Test individual endpoints with curl/httpie
# 4. Validate environment variables
# 5. Check CORS/middleware configuration
# 6. Verify database connection pool status
```

### Phase 2: Frontend React Fixes (Agent 2)
```bash
# 1. Audit all useEffect hooks for dependency issues
# 2. Add React.StrictMode compatibility
# 3. Implement proper cleanup functions
# 4. Add error boundaries around critical components
# 5. Optimize re-render patterns
# 6. Add request cancellation for aborted fetches
```

### Phase 3: MapView Integration (Agent 3)
```bash
# 1. Verify Mapbox/Leaflet/OpenLayers initialization
# 2. Configure all data layer sources
# 3. Test clustering algorithms (PostGIS vs client-side)
# 4. Validate GeoJSON parsing
# 5. Ensure proper zoom-level layer switching
# 6. Test performance with large datasets
```

### Phase 4: Integration Testing (Agent 4)
```bash
# 1. End-to-end API → Frontend data flow
# 2. Verify no regressions in existing features
# 3. Load testing with concurrent requests
# 4. Cross-browser compatibility
# 5. Mobile responsiveness
# 6. Network throttling scenarios
```

---

## 🔧 EXPECTED DELIVERABLES

### Code Changes
1. **API Gateway fixes** with proper error handling
2. **React component refactoring** (App.tsx, OpsStatus.tsx, Dashboard.tsx)
3. **MapView configuration** with all layers enabled
4. **PostGIS query optimization** for clustering
5. **Environment configuration** updates if needed

### Documentation
1. API endpoint documentation
2. MapView layer configuration guide
3. Deployment/migration notes
4. Testing procedures
5. Troubleshooting guide

### Validation
1. **All API endpoints return 200 OK**
2. **Zero ERR_CONNECTION_RESET errors**
3. **Zero "Maximum update depth" errors**
4. **MapView renders all data layers correctly**
5. **PostGIS clustering performs within 200ms**
6. **Dashboard loads without errors**

---

## ⚠️ CONSTRAINTS & SAFETY CHECKS

### Non-Breaking Changes
- **No database schema modifications** without explicit approval
- **Maintain backward API compatibility**
- **Preserve existing route structures**
- **Keep current authentication/authorization**

### Performance Targets
- **API response time**: < 500ms (p95)
- **Map tile loading**: < 200ms
- **Initial page load**: < 3s
- **PostGIS queries**: < 300ms

### Testing Requirements
- **Unit tests** for all modified components
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- **Load tests** for clustering performance

---

## 📂 FILES TO EXAMINE

```
#codebase
#file:copilot-instructions.md
#file:App.tsx
#file:OpsStatus.tsx
#file:Dashboard.tsx
#file:MapView.tsx (or equivalent)
#file:api/routes/* (all API route handlers)
#file:api/health.ts
#file:api/data-status/*
#file:api/geocode/*
#file:api/reports/dashboard-data.ts
#file:config/* (database, API gateway config)
#file:.env (environment variables)
```

---

## 🚀 EXECUTION STRATEGY

### Step 1: Root Cause Analysis (15 min)
```bash
# Run comprehensive diagnostics
npm run test
npm run lint
curl http://localhost:5174/api/health -v
docker-compose logs api-gateway
psql -U user -d db -c "SELECT PostGIS_version();"
```

### Step 2: Fix API Gateway (30 min)
- Restore health endpoints
- Fix PostGIS connection issues
- Resolve CORS/middleware problems
- Add proper error handling

### Step 3: Fix React Components (30 min)
- Eliminate infinite re-render loops
- Add proper useEffect dependencies
- Implement error boundaries
- Add loading states

### Step 4: Enable MapView Layers (45 min)
- Configure all data layer sources
- Implement detailed rendering (points, polygons)
- Test clustering at multiple zoom levels
- Optimize performance

### Step 5: Integration Testing (30 min)
- Verify all APIs return 200
- Confirm zero console errors
- Test MapView with real data
- Performance validation

### Step 6: Documentation (15 min)
- Update README
- Document API changes
- Add troubleshooting guide

---

## 📊 SUCCESS METRICS

```javascript
// All of these must be TRUE
const successCriteria = {
  apiHealth: {
    '/api/health': 200,
    '/api/data-status/health': 200,
    '/api/geocode/search': 200,
    '/api/reports/dashboard-data': 200
  },
  consoleErrors: {
    ERR_CONNECTION_RESET: 0,
    'Maximum update depth': 0,
    '500 Internal Server Error': 0
  },
  mapView: {
    layersVisible: ['clusters', 'polygons', 'markers', 'points'],
    renderingComplete: true,
    performanceOk: true // < 200ms tile load
  },
  postgis: {
    connected: true,
    clusteringWorking: true,
    queryLatency: < 300 // ms
  }
};
```

---

## 🔄 ITERATIVE APPROACH

If initial fixes don't resolve all issues:

1. **Log detailed error traces** from both frontend & backend
2. **Isolate failing components** one by one
3. **Test with minimal configurations** before adding complexity
4. **Use feature flags** to gradually enable layers
5. **Monitor resource usage** (memory, CPU, database connections)

---

## 💡 ADDITIONAL CONTEXT

- **Web search enabled**: Use for latest PostGIS/mapping library docs
- **Switch agent if needed**: Different agents for API vs Frontend
- **Copilot instructions**: Reference `copilot-instructions.md` for project-specific patterns
- **No assumptions**: If something is unclear, ask for clarification before proceeding

---

## ✅ FINAL CHECKLIST

Before marking as complete:

- [ ] All API endpoints returning 200 OK
- [ ] Zero console errors in browser
- [ ] MapView displays all configured layers
- [ ] PostGIS clustering queries optimized
- [ ] No performance regressions
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code review ready
- [ ] No breaking changes introduced
- [ ] Deployment instructions provided

---

**Start Date**: 2026-02-10  
**Target Completion**: Same day (< 3 hours active work)  
**Priority**: P0 (Critical)  
**Assignee**: Claude Opus 4.6 Agent Team

---

## 🎯 AGENT TEAM COORDINATION (If Using Agent Teams)

### Agent 1: Backend API Specialist
- Fix API Gateway endpoints
- Restore health checks
- Optimize PostGIS queries
- Handle database connections

### Agent 2: Frontend React Engineer
- Fix infinite re-render loops
- Implement error boundaries
- Add proper loading states
- Optimize component lifecycle

### Agent 3: MapView Integration Expert
- Configure all data layers
- Implement detailed rendering
- Test clustering performance
- Handle GeoJSON parsing

### Agent 4: QA & Integration Tester
- End-to-end testing
- Performance validation
- Cross-browser testing
- Load testing

**Coordination Point**: All agents sync after Phase 2 completion to ensure no conflicts.

---

**Remember**: Use adaptive thinking (high effort) for complex debugging. Don't hesitate to web search for latest PostGIS clustering techniques or React optimization patterns.
