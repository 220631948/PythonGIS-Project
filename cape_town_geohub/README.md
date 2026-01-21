# Cape Town GeoHub 🌍

A consolidated GIS utility and dashboard for Cape Town urban planning, research, and analysis. This platform centralizes spatial data from the City of Cape Town Open Data Portal into an interactive, high-performance interface.

![Cape Town GeoHub](/static/assets/app_screenshot.png)

## 🚀 Quick Start

Ensure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.

1. **Clone the repository**
   ```bash
   git clone https://github.com/mr/cape-town-geohub.git
   cd cape-town-geohub
   ```

2. **Launch the stack**
   ```bash
   ./scripts/docker-start.sh
   ```

3. **Access the Application**
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **API Documentation:** [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

## 🏗️ Architecture

- **Frontend:** React 19 (Vite), Leaflet.js, Turf.js, Tailwind CSS (Vanilla CSS modules).
- **Backend:** Python 3.10 (FastAPI), GeoPandas, Shapely, Gunicorn.
- **Infrastucture:** Docker, Nginx, GitHub Actions (CI/CD).

## 🛠️ Key Features

- **7-Module Dashboard:** Services, Transport, Safety, Environment, Land Use, Utilities, and Infrastructure.
- **Real-Time Data Extraction:** Automated ETL pipeline that downloads, extracts (ZIP/Shapefiles), reprojects (EPSG:2048 to EPSG:4326), and caches data from CCT.
- **Spatial Intelligence:** 
  - **Services:** Informal settlement access scoring (Water/Health/Education).
  - **Transport:** Walking buffer analysis (10/20/30 min connectivity).
  - **Safety:** Ethical criminology mapping (Precinct-level aggregation).
- **Offline Capability:** Progressive Web App (PWA) with local tile caching and offline-first data hooks.

## 📊 Data Sources

All spatial data is sourced from the **City of Cape Town Open Data Portal**. 
See [DATA_SOURCES.md](DATA_SOURCES.md) for a full attribution table.

## 📜 Ethics & Privacy

We adhere to strict ethical guidelines regarding spatial data. See [ETHICS.md](ETHICS.md) for details on how we handle sensitive information and crime statistics.

## ⚖️ License

This projected is licensed under the **MIT License**.
*Note: The application code is MIT, but the underlying data layers belong to the City of Cape Town and are subject to their Open Data License.*
