# GitHub Copilot Instructions - Cape Town GeoHub

You are working on **Cape Town GeoHub**, a geospatial decision-support platform combining FastAPI, React + Leaflet, and municipal open data.

## Big Picture Architecture

The app is a **Map-First Dashboard** with three layers:
1. **Frontend** (`frontend/src/`): React 19 + Vite, Leaflet for maps, module-based feature organization
2. **Backend** (`app/`): FastAPI serving GeoJSON via `/api`, using GeoPandas for spatial ops
3. **Data Pipeline** (`data/`, `scripts/`): ArcGIS Open Data → local cache → API

**Key Spatial Contract**: All external data flows through `EPSG:4326` (WGS84). Internal analysis may use `EPSG:32734` (UTM 34S for Cape Town). The frontend sends lat/lng, backend returns GeoJSON.

## Component Organization

Frontend follows a **module-per-feature** pattern:
- `src/modules/services/` → Informal Settlements + Water/Energy access
- `src/modules/transport/` → MyCiTi, routing, isochrones
- `src/modules/safety/` → Crime stats (aggregated by precinct)
- `src/components/Common/` → Reusable UI (buttons, modals, toasts)

**Example**: Adding a new "Housing" module? Create `src/modules/housing/HousingModule.jsx` + matching backend route in `app/api/housing.py`.

## Critical Developer Workflows

### Local Dev (Vite + FastAPI)
```bash
# Backend (from project root)
.venv/bin/uvicorn app.main:app --reload --port 8000

# Frontend (from frontend/)
npm run dev  # Runs on :5173
```

### Linting & Type Checking
```bash
# Frontend - MUST pass before commit
npm run lint   # ESLint (enforces TypeScript strict mode)
npm run build  # Vite build validation

# Backend
pytest  # Runs spatial logic tests
```

### Data Refresh
```bash
python scripts/update_data.py  # Pulls latest from City of Cape Town ArcGIS
```

## Project-Specific Conventions

### Styling: CSS Variables > Tailwind
Use `index.css` design tokens (`--accent`, `--surface`, `--text-primary`) instead of inline Tailwind classes. Dark mode is handled via `[data-theme='dark']`.

### State Management: Context + Hooks
No Redux. Global state lives in:
- `src/App.jsx` → `MapContext` (map center, zoom, active layers)
- `src/hooks/useOfflineData.js` → IndexedDB for PWA offline support

### GeoJSON Handling
Backend always returns:
```json
{
  "type": "FeatureCollection",
  "features": [...],
  "crs": { "type": "name", "properties": { "name": "EPSG:4326" } }
}
```
Frontend consumes via `react-leaflet`'s `<GeoJSON>` component.

### API Patterns
FastAPI routes follow:
```python
@router.get("/{module}/layer")
async def get_layer(simplify: float = 0.001) -> GeoJSONResponse:
    # Uses geopandas.simplify() for performance
```
Simplification is **required** for large datasets (zoning, flood risk).

## Integration Points

### Map ↔ Backend
`src/api-client.js` wraps all `/api/*` calls. Example:
```javascript
await apiClient.fetchLayer('services', 'access')  // → /api/services/access
```

### Offline Support
`useOfflineData.js` syncs to IndexedDB. When offline, layers are served from local cache. Background sync queue processes writes when reconnected.

### External Data Sources
All datasets come from **City of Cape Town Open Data Portal** (ArcGIS REST). Attributions are tracked in `DATA_SOURCES.md`. **Never remove attribution comments** from GeoJSON responses.

## Accessibility Requirements (WCAG 2.1 AA)

- All map controls must be keyboard-navigable (`tabindex`, `onKeyDown`)
- Icons require `aria-label` (e.g., `<ZoomIn aria-label="Zoom in map" />`)
- Color contrast: Text must meet 4.5:1 ratio (use CSS vars for compliance)
- Use semantic HTML: `<nav>`, `<main>`, `<section>` over `<div>`

## Common Gotchas

1. **LatLng Order**: Leaflet uses `[lat, lng]`, GeoJSON uses `[lng, lat]`
2. **CRS Mismatch**: If map shows Antarctica, you likely passed EPSG:32734 coords to Leaflet (which expects 4326)
3. **Vite ENV Vars**: Must be prefixed with `VITE_` to be accessible in browser
4. **React 19 Rules**: The eslint config disables `set-state-in-effect` warnings for data-fetching hooks (intentional)

## Before You Commit

- [ ] Run `npm run lint` (frontend)
- [ ] Verify map loads without console errors at `http://localhost:5173`
- [ ] Check that GeoJSON layers render (click a module in sidebar)
- [ ] Test mobile sidebar toggle (responsive layout)
