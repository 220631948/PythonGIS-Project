# Cape Town GeoHub Copilot Instructions

## 🔭 Project Overview

Cape Town GeoHub is a geospatial decision-support platform blending open data, spatial analysis, and a modern web UI.

- **Backend:** FastAPI, GeoPandas, Shapely (Spatial Analysis), PostGIS (Optional).
- **Frontend:** React 19, Vite, Leaflet, Recharts.
- **Infrastructure:** Docker Compose, Nginx.

## 🏗 Architecture & Core Patterns

### Backend (`app/`)

- **Entry Point:** `app/main.py`. Mounts API routers and serves static frontend build in prod.
- **API Structure:** Routes are modularized in `app/api/`. New endpoints must be added to `app/api/__init__.py` and `app/main.py`.
- **Data Loading:** **CRITICAL**. Do not fetch external data directly in routes. Use `app/core/data_loader.py` which handles caching, CRS normalization (EPSG:4326), and error handling.
  ```python
  from app.core.data_loader import data_loader
  gdf = data_loader.get_gdf("dataset_key") # Returns GeoDataFrame
  ```
- **Spatial Operations:**
  - Input/Output: **EPSG:4326** (WGS84).
  - Analysis/Metrics: **EPSG:32734** (UTM Zone 34S) for accurate meters.
  - Geometry Engine: Shapely & GeoPandas.
  - Heavy logic: Place in `app/spatial_analysis/` modules, not in route handlers.

### Frontend (`frontend/`)

- **Structure:**
  - `src/components`: Reusable UI bricks.
  - `src/modules`: Domain-specific features (e.g., `RoutePanel`, `MapView`).
  - `src/styles`: CSS organization (Project currently uses standard CSS/CSS Modules, **NOT** Tailwind yet).
  - `src/api-client.js`: Centralized Axios/fetch wrapper.
- **Map Interaction:**
  - Use `react-leaflet` components.
  - State management for map layers often resides in `MapView.jsx` or specialized contexts.
  - **Performance:** For large datasets (>1k points), use clustering or simplified GeoJSON.

## 🎨 Frontend Polishing & UX Expectations

- **Visual System:** Keep the color palette and spacing defined via CSS variables in `frontend/src/styles/variables.css` (and its imports). Avoid one-off inline styles; reuse `App.css`/`index.css` tokens so the “Cape Town GeoHub” identity stays consistent across `MapView.jsx`, `Sidebar.jsx`, and `RoutePanel.jsx`.
- **Layout posture:** The main map should occupy the primary visual plane. Use `main` and `section` wrappers in `App.jsx`/`App.css` to enforce a map-to-panel split while applying modern glassmorphism styles for `Sidebar` cards (`frontend/src/components/Card`). Any new responsive tweaks should be tested via `npm run dev` with `MapView` and `Sidebar` simultaneously open to ensure mobile controls stay touch-friendly.
- **UX Feedback:** Build skeleton components (`frontend/src/components/SkeletonLoader.jsx`) around `MapView` data hooks and `RoutePanel`. Tie spatial query loading states to the existing `useMapData` hook so the UI shows both loaders and “Processing…” indicators before GeoJSON layers render.
- **Empty States & Layer Toggles:** Mirror the existing layer control patterns in `MapView.jsx` by keeping toggle logic in the same module; encourage minimal toggles per click with accessible buttons (see `frontend/src/components/LayerToggleButton.jsx`). Provide empty-state cards when APIs return no features (refer to `frontend/src/modules/Dashboard.jsx` empty-state structure as a template).
- **Accessibility Checklist:**
  - Prefer `<button>` or `<a>` with `aria-label` for icons in `MapView` and `Sidebar`. If a component renders a Leaflet marker (`frontend/src/components/MarkerWithLabel.jsx`), ensure it exposes `aria-label` via props.
  - Maintain keyboard focus outlines (the global focus style is defined in `index.css`). Any focus removal must be replaced with an equivalent outline so `Tab` navigation across map controls, filters, and dialogs works consistently.
  - Validate text contrast using the palette defined in `frontend/src/styles/variables.css`; maintain a minimum ratio of 4.5:1 for body text and 3:1 for large headings.
  - Use semantic wrappers such as `<main>`, `<nav>`, and `<section>` when structuring `App.jsx`, `MapView.jsx`, and `Sidebar.jsx`. Replace non-semantic `div` clusters only when it improves screen reader grouping.

## 🕸 Workflow Signals & Integration Notes

## 🛠 Developer Workflow

### Environment & Startup

- **Docker (Preferred):** `docker-compose up --build`. Frontend at `:3000`, API at `:8000`.
- **Local Split:**
  - Backend: `uvicorn app.main:app --reload` (Port 8000).
  - Frontend: `npm run dev` (Port 5173).
  - **Diff:** Frontend dev server proxies `/api` to localhost:8000 (check `vite.config.js`).

### Testing & Quality

- **Backend:** `pytest` (Run from root).
- **Frontend:** `npm run lint` (ESLint) and `npm run test:e2e` (Playwright).
- **Conventions:**
  - Python: Follow PEP 8 (enforced by Black/Isort if configured).
  - JS: ESLint + Prettier.

### Key Commands

```bash
# Refresh cached spatial data
python scripts/update_data.py

# Run full backend test suite
pytest

# Docker deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🚨 Critical Implementation Details

1. **Error Handling:** Use `app.core.exceptions.GeoHubException` for predictable API errors.
2. **Async:** FastAPI routes are `async`. Use `await` for I/O (although GeoPandas is synchronous, so wrap heavy spatial ops if blocking the event loop is a concern).
3. **Data Proxy:** The generic endpoint `GET /api/data/{dataset_key}` uses "Domain Intelligence" (`proxy_data` in `main.py`). When adding new data workflows, consider if they belong here or in a dedicated endpoint.
4. **PWA:** Frontend is PWA-enabled (`vite-plugin-pwa`). Ensure `manifest.json` handles changes to app capabilities.

## 🤝 Integration Points

- **Dataset Keys:** Defined in `app/config.py` (`DATA_URLS`). Added keys here automatically become available to the `data_loader`.
- **Frontend-Backend Contract:** API returns standard GeoJSON `FeatureCollection` for spatial data. Frontend expects `properties` dictionary to match specific schema for tooltips/popups.
