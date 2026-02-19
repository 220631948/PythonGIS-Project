# Cape Town GeoHub — Frontend

_Last updated: 2026-02-19_

The frontend is a mobile-responsive GIS application built with **React**, **Vite**, and **Leaflet**. It provides the interactive map experience, analysis tools, and collaboration workflows for the Cape Town GeoHub platform.

## ✨ Key Features

- **Interactive Map UI** with multiple basemaps and layer controls
- **Routing & Isochrones** for transit and accessibility analysis
- **Site Suitability** tools triggered via map interactions
- **Data filtering & thematic styling** for services, safety, land use, and utilities
- **Collaboration markers** for shared annotations
- **Offline-ready PWA** with data caching and install prompts
- **Keyboard & accessibility support** (skip links, ARIA live regions)

## 🧰 Tech Stack

- **React 19** + **Vite 6**
- **Leaflet** + **React-Leaflet**
- **Turf.js** for client-side spatial operations
- **Lucide React** icons
- **vite-plugin-pwa** for offline support

## 📂 Key UI Modules

- `MapView.jsx` — Leaflet map wrapper, drawing tools, layers
- `Sidebar.jsx` — module navigation and layer controls
- `RoutePanel.jsx` — routing, isochrones, nearest services
- `Dashboard.jsx` — analytics & reporting views
- `OfflineDataManager.jsx` — cached dataset management
- `SearchAutocomplete.jsx` — geocode search component

## 🚀 Development

```bash
npm install
npm run dev
```

The dev server runs at **http://localhost:5173**.

## 🏗️ Build & Preview

```bash
npm run build
npm run preview
```

## ✅ Linting & Tests

```bash
npm run lint
npm run test:e2e
```

## 📍 CRS Notes

Leaflet operates in **EPSG:4326 (WGS84)**. Projected measurements are delegated to the backend or Turf.js as needed.

## 🧭 API Integration

The frontend expects the backend at `/api` (proxied via the dev server or Nginx in production). Relevant endpoints include:

- `GET /api/portal/datasets/{id}/geojson`
- `GET /api/network/route`
- `GET /api/network/isochrone`
- `POST /api/filter/query`

## 📚 Related Docs

- `docs/USER_GUIDE.md`
- `docs/ENHANCED_FEATURES.md`
- `docs/OPEN_DATA_WORKFLOW.md`
