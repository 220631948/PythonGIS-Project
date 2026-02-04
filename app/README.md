# Cape Town GeoHub — Backend API

The backend powers all spatial analysis and data services for Cape Town GeoHub. It exposes REST endpoints for routing, isochrones, open data retrieval, filtering, collaboration markers, and advanced geospatial analysis.

## ✨ Core Capabilities

- **Spatial analysis**: buffers, intersections, point-in-polygon, suitability scoring
- **Network analysis**: routing, isochrones, service areas
- **Data orchestration**: ingest & normalize datasets from the Cape Town Open Data Portal
- **Collaboration**: shared map annotations & markers
- **Reporting & export**: GeoJSON, CSV, summaries

## 🧰 Tech Stack

- **FastAPI** + **Uvicorn**
- **GeoPandas**, **Shapely**, **PyProj**
- **Pandas**, **NumPy**
- Optional PostGIS support via `DATABASE_URL`

## 📂 Code Structure

```
app/
  api/            # Feature routers (network, portal, suitability, etc.)
  core/           # data loader, cache manager, database helpers
  models/         # Pydantic models and schema definitions
  spatial_analysis/ # analysis helpers
  utils/          # shared utilities
```

## 🚀 Run Locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧭 CRS & Spatial Settings

- **Input / storage**: `EPSG:4326` (WGS84)
- **Projected analysis**: `EPSG:32734` (UTM 34S for Cape Town)

These defaults are defined in `app/config.py`.

## 🔑 Configuration (ENV)

You can override defaults via `.env`:

```
API_PREFIX=/api
POSTGRES_USER=geohub
POSTGRES_PASSWORD=geohub_password
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=geohub_db
```

## 🧪 Tests

```bash
pytest
```

## 📚 Related Docs

- `docs/TECHNICAL_DOCS.md`
- `docs/DATA_SOURCES.md`
- `ETHICS.md`
