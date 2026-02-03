# Cape Town GeoHub

Cape Town GeoHub is a full-stack geospatial decision-support platform that blends open data, spatial analysis, and a modern web map UI. It provides a FastAPI-powered GIS backend and a React + Leaflet frontend designed for planners, analysts, and community stakeholders.

## ✨ Highlights

- **Interactive Web GIS** with multiple basemaps, layer controls, and analysis tools.
- **Spatial analytics** (routing, isochrones, suitability, buffering, overlays).
- **Open data ingestion** from the City of Cape Town Open Data Portal.
- **Collaboration features** for annotations and shared context.
- **Offline/PWA-ready UI** for field-friendly workflows.

## 🧭 Architecture

```
frontend/   → React + Vite UI (Leaflet mapping)
app/        → FastAPI backend (GeoPandas, Shapely, PyProj)
data/       → raw/processed/cache datasets
scripts/    → data loading + deployment helpers
docs/       → technical docs + ethics
```

## 🧰 Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript 5
- **Build Tool**: Vite 6 (Fast HMR, optimized production builds)
- **Mapping**: Leaflet 1.9, React-Leaflet, Leaflet-Draw, Leaflet-MiniMap
- **State Management**: React hooks (useState, useEffect, custom hooks)
- **Utilities**: Turf.js (spatial operations), LocalForage (offline storage)
- **UI**: Lucide React icons, custom component library
- **PWA**: Offline-first architecture with service workers

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Spatial Libraries**: GeoPandas, Shapely, PyProj
- **Database ORM**: SQLAlchemy 2.0, GeoAlchemy2
- **Server**: Gunicorn with Uvicorn workers
- **API**: RESTful endpoints with automatic OpenAPI docs

### Database
- **Primary**: PostgreSQL 15 with PostGIS 3.3
- **Spatial Features**: Geometry types, spatial indexes, CRS transformations
- **Extensions**: PostGIS, PostGIS Topology, hstore

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose (v2)
- **Web Server**: Nginx (production reverse proxy)
- **Security**: Non-root containers, secrets management, CORS policies


## 🚀 Quick Start

### Option A — Docker (Recommended)
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option B — Local Development
**Backend**
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Type Checking & Tests
- Backend tests: `pytest`
- Frontend lint: `npm run lint`
- Frontend e2e: `npm run test:e2e`
- Type check: `npm run type-check`

## ⚙️ Configuration

The backend reads environment variables via `.env` (optional). Defaults are defined in `app/config.py`:

- `POSTGRES_*` for PostGIS integrations
- `API_PREFIX=/api`
- `TARGET_CRS=EPSG:4326`
- `PROJECTED_CRS=EPSG:32734` (UTM 34S for Cape Town)

## 🗺️ Data Sources & Caching

Data is fetched from the City of Cape Town Open Data Portal and cached under `data/cache/`.
See `DATA_SOURCES.md` and `docs/DATA_SOURCES.md` for curated dataset references.

## 🧪 Testing

**Backend**
```bash
pytest
```

**Frontend**
```bash
cd frontend
npm run lint
npm run test:e2e
```

## 🧩 Useful Scripts
- `scripts/load_spatial_data.py` — download & normalize datasets
- `scripts/update_data.py` — refresh cached data
- `scripts/start-all.sh` — helper to start services

## 📦 Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```
Environment variables: see `.env.example` for DB, API, frontend, cache, and rate-limit settings.

## 📚 Documentation
- `OFFLINE_SETUP.md`
- `TYPESCRIPT_MIGRATION.md`
- `docs/USER_GUIDE.md`
- `docs/TECHNICAL_DOCS.md`
- `docs/OPEN_DATA_WORKFLOW.md`
- `ETHICS.md`

## 🤝 Contributing

Issues and PRs are welcome. Please reference the ethics and data usage guidelines in `ETHICS.md`.
