# Cape Town GeoHub (PythonGIS Project)

A sophisticated Spatial Data Infrastructure (SDI) and GIS platform for the City of Cape Town, built to empower urban planners, researchers, and citizens with high-quality spatial insights.

## 🌟 Overview

Cape Town GeoHub is a full-stack GIS application that integrates diverse spatial datasets from the City of Cape Town Open Data Portal with advanced analysis tools. It supports real-time collaboration, offline data management, and complex spatial queries.

### Key Features
- **Dynamic Map View**: High-performance interactive map built with React-Leaflet.
- **Advanced Spatial Analysis**:
  - Site suitability analysis.
  - Travel time (isochrone) and routing.
  - Neighborhood amenities and proximity analysis.
- **Collaboration Tools**: Location-based annotations and shared project markers for team collaboration.
- **Data Catalog**: Comprehensive access to City of Cape Town datasets including transport, environment, and social infrastructure.
- **Offline Mode**: Full support for field data collection and map viewing in low-connectivity environments.
- **Real-time Integration**: Live feeds for city services and infrastructure status.

## 🏗️ Architecture

The project follows a modern decoupled architecture:

- **Frontend**: React (Vite) + Leaflet for a fast, responsive GIS interface.
- **Backend**: FastAPI (Python) for high-performance spatial API endpoints.
- **Spatial Engine**: GeoPandas, Shapely, and PyProj for robust server-side geometry processing.
- **Data Store**: Efficient local JSON/Parquet storage for metadata and cached spatial layers.

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker & Docker Compose (optional for containerized deployment)

### Local Development

#### Backend Setup
1. Navigate to the project root.
2. Create a virtual environment: `python -m venv .venv`
3. Activate it: `source .venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the dev server: `uvicorn app.main:app --reload`

#### Frontend Setup
1. Navigate to `cape_town_geohub/frontend`.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## 📁 Project Structure

```text
.
├── cape_town_geohub/
│   ├── app/                # FastAPI Application
│   │   ├── api/            # REST API Routes
│   │   ├── core/           # Business Logic & Data Loading
│   │   ├── models/         # Pydantic Schemas
│   │   └── spatial_analysis/ # Geometry processing logic
│   ├── frontend/           # React Application
│   │   ├── src/
│   │   │   ├── components/ # UI & Map Components
│   │   │   ├── hooks/      # Custom React Hooks
│   │   │   └── modules/    # Analysis Modules
│   └── scripts/            # Utility & Maintenance Scripts
├── Dockerfile              # Containerization
└── compose.yaml            # Multi-service Orchestration
```

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | FastAPI, GeoPandas, Shapely, Pydantic |
| **Frontend**| React (Hooks), Vite, Leaflet, CSS Modules |
| **Spatial**  | EPSG:4326 (WGS84) & EPSG:32733 (UTM 33S) |
| **DevOps**  | Docker, GitHub Actions |

## ⚖️ License & Ethics

This project is developed with a focus on ethical GIS practices. Please refer to [ETHICS.md](file:///home/mr/PycharmProjects/PythonGIS%20Project/cape_town_geohub/ETHICS.md) for our data privacy and usage guidelines.
