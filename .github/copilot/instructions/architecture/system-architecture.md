# Architecture Guidelines

## Map-First Dashboard
- Frontend is React 19 + Vite with Leaflet; keep map interactions responsive and keyboardable.
- Feature modules live under `frontend/src/modules`; cross-cutting UI lives in `frontend/src/components` and `frontend/src/hooks`.
- Use `MapContext` (App.tsx) for shared map state (center, zoom, active layers).

## Backend Layering
- FastAPI app in `app/main.py` mounts routers under `/api/v1` using `settings.API_PREFIX`.
- Keep data access in dedicated loader/utility modules (e.g., `app/core/data_loader.py`, `app/utils`); avoid DB calls from route handlers directly.
- Spatial analysis helpers live in `app/spatial_analysis`; reuse them instead of duplicating geoprocessing.

## Data & CRS Contracts
- External and persisted data must use **EPSG:4326**. Project to **EPSG:32734** for metric calculations, then return to 4326.
- GeoJSON responses must follow RFC 7946 and include CRS only when not 4326.
- Leaflet expects `[lat, lng]`; GeoJSON uses `[lng, lat]`.

## API Design
- Keep endpoints async; wrap CPU-bound geospatial work with `asyncio.to_thread`.
- Add pagination and `simplify` query params for heavy layers; default simplification is required for large datasets.
- Provide OpenAPI examples and document CRS assumptions.

## Offline & PWA
- Offline data is cached via `useOfflineData` (IndexedDB). When adding write flows, enqueue background sync tasks and guard for offline mode.

## Observability
- Prefer structured logging with context (dataset name, CRS, bounding box). Avoid printing sensitive env values.