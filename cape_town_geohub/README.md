# Cape Town GeoHub 🏙️

A comprehensive GIS web application for urban planning, environmental analysis, and spatial decision-making in Cape Town, South Africa.

**🔒 100% Real Open Data** - All spatial data is sourced exclusively from official City of Cape Town and South African government open data portals. No mock or synthetic data is used.

![Cape Town GeoHub](https://img.shields.io/badge/Cape%20Town-GeoHub-blue?style=for-the-badge&logo=mapbox)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Open Data](https://img.shields.io/badge/Open%20Data-Verified-green?style=flat-square)

## 🌟 Enhanced Features

### 🗺️ **Advanced Mapping Interface**
- **Multiple Basemaps**: Streets, Aerial Imagery, Satellite, Dark, and Terrain
- **Drawing Tools**: Create polygons, lines, rectangles, circles, and markers
- **Measurement Tools**: Distance and area measurements
- **Fullscreen Mode**: Immersive mapping experience
- **Location Services**: Find your location on the map
- **Minimap**: Overview navigation

### 📊 **Comprehensive Data Portal**
- **24+ Datasets** from City of Cape Town Open Data Portal
- **Real-time Data Access**: Direct integration with ArcGIS services
- **Smart Caching**: Optimized data loading and storage
- **Layer Management**: Toggle, style, and organize spatial data

### 🏗️ **Site Suitability Analysis**
- **9 Criteria Analysis**: Flood risk, biodiversity, wetlands, zoning, transport, utilities
- **Multi-Site Comparison**: Rank and compare multiple locations
- **Sensitivity Analysis**: Test how criteria weights affect results
- **Environmental Impact**: Biodiversity, carbon footprint, noise assessment
- **Economic Feasibility**: ROI potential, development costs, market demand

### 🤝 **Collaborative Spatial Review**
- **Location-based Comments**: Threaded discussions anchored to specific map coordinates
- **Shared Markers**: Team-wide annotations for planning and review
- **Real-time Updates**: Immediate feedback visibility for collaborative projects

### 📤 **Data Export & Reporting**
- **Multi-format Support**: Export datasets to GeoJSON, CSV, XLSX, and KML
- **Analytical Reports**: Export suitability and spatial analysis results
- **Printable Maps**: Generate formatted PDF reports with legends, titles, and scale bars

### 📱 **Mobile & Field Data Support**
- **Field Capture**: Mobile-optimized forms for on-site data collection
- **Offline Mode**: Capture data without connectivity and sync later
- **Photo Uploads**: Attach site photos directly to spatial records

### 🔬 **Advanced Spatial Analyses**
- **Viewshed Analysis**: Calculate visibility areas from any point
- **Network Analysis**: Routing and travel time (isochrones) for transport
- **Topology Validation**: Ensure spatial data integrity and connectivity
- **Proximity Analysis**: Find nearest facilities and service areas

### 🔍 **Discovery & Metadata**
- **Metadata Catalog**: Searchable index of all datasets with lineage and attributes
- **Advanced Filtering**: Complex attribute and spatial query builders
- **Live Data Feeds**: Real-time traffic, weather, and service disruption monitoring

### 📈 **UX & Interaction**
- **Shareable State**: Map views saved in URL for easy sharing
- **Guided Onboarding**: Interactive tours explaining major features
- **Keyboard Shortcuts**: Power-user navigation for faster analysis

### 📊 **Data Status & Monitoring**
- **Source Health Checks**: Real-time monitoring of data source availability
- **Data Provenance**: Full traceability of data origins and licensing
- **Retrieval Logs**: Audit trail for all data fetch operations
- **Quality Validation**: Automated geometry and attribute validation

## 📜 Open Data Policy

Cape Town GeoHub is committed to using **only verified open data** from official sources:

| Source | Portal URL | License |
|--------|------------|---------|
| City of Cape Town Open Data | https://odp.capetown.gov.za/ | CCT Open Data License |
| City of Cape Town eGIS | https://egis.capetown.gov.za/ | CCT Open Data License |
| SA Weather Service | https://www.weathersa.co.za/ | SAWS Open Data |
| SAAQIS (Air Quality) | https://saaqis.environment.gov.za/ | DEA Open Data |

**No mock or synthetic data is used in production.** All datasets are fetched directly from official APIs.

For full data source documentation, see [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md).

## 🚀 Quick Start

The recommended way to run Cape Town GeoHub is using Docker, as it handles all complex GIS dependencies automatically.

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (only for local frontend development)

### Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/cape-town-geohub.git
   cd cape-town-geohub
   ```

2. **Start with Docker (Recommended)**
   ```bash
   # Build and start the entire stack
   docker compose up --build -d
   ```

   The application will be available at:
   - **Web App**: http://localhost:8000
   - **API Docs**: http://localhost:8000/api/docs

3. **Local Development (Alternative)**
   If you wish to run components locally, see [TECHNICAL_DOCS.md](docs/TECHNICAL_DOCS.md) for detailed setup of GDAL/GEOS libraries.

   **Frontend (Local)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Access at http://localhost:5173

## 📚 API Documentation

### Core Endpoints

#### Health & Monitoring
- `GET /api/health` - System health check with metrics
- `GET /api/stats` - Detailed request and error statistics
- `GET /api/config` - Application configuration
- `POST /api/cache/clear` - Clear application cache

#### Data Portal
- `GET /api/portal/categories` - Available dataset categories
- `GET /api/portal/datasets` - All available datasets
- `GET /api/portal/datasets/{id}/geojson` - Fetch dataset as GeoJSON

#### Site Suitability
- `GET /api/suitability/analyze` - Point-based suitability analysis
- `POST /api/suitability/analyze-polygon` - Polygon area analysis
- `POST /api/suitability/compare` - Multi-site comparison
- `POST /api/suitability/sensitivity-analysis` - Weight sensitivity testing
- `GET /api/suitability/criteria` - Available analysis criteria

#### Spatial Analysis
- `POST /api/spatial/point-in-polygon` - Point-in-polygon analysis
- `POST /api/spatial/buffer` - Buffer creation and analysis
- `POST /api/spatial/line-intersects` - Line intersection analysis
- `POST /api/spatial/dissolve` - Polygon dissolve operations

#### Domain Analysis
- `GET /api/services/access` - Service accessibility analysis
- `GET /api/transport/accessibility` - Transport accessibility
- `GET /api/safety/precincts` - Safety and crime analysis
- `GET /api/environment/flood-risk` - Environmental risk assessment
- `GET /api/land-use/zoning` - Land use and zoning data

## 🗂️ Dataset Categories

### 🏛️ **Boundaries** (4 datasets)
- City boundary, suburbs, wards, subcouncils

### 🏗️ **Infrastructure** (4 datasets)
- Roads, buildings, railway network, railway stations

### 🌿 **Environment** (4 datasets)
- Wetlands, biodiversity network, protected areas, flood zones

### 📋 **Planning** (3 datasets)
- Zoning schemes, development applications, urban edge

### 🚇 **Transport** (3 datasets)
- MyCiTi routes, MyCiTi stops, taxi ranks

### 🏥 **Services** (4 datasets)
- Health facilities, schools, libraries, water access points

### 👮 **Safety** (3 datasets)
- Police stations, fire stations, crime precincts

### 🗑️ **Utilities** (3 datasets)
- Sanitation facilities, waste collection zones, recycling facilities

## 🧪 Testing & Verification

### Automated Verification Scripts

Run the verification scripts to check system status:

```bash
# Verify all data sources are accessible
python verify_data_sources.py

# Comprehensive system health check
python verify_system.py

# Run existing API tests (requires backend running)
cd cape_town_geohub && python test_api.py
```

### Current System Status ⚠️

**CRITICAL ISSUES** (Must Fix Before Production):

1. **Data Sources**: Many configured URLs return 500 errors
2. **Mock Data**: System may generate mock data (violates 100% real data requirement)
3. **Dependencies**: GIS libraries cannot be installed in current environment

### Quick Health Check

```bash
# Check if core services can start
curl -f http://localhost:8000/api/health || echo "Backend not running"

# Test a data source
curl -s "https://odp-cctegis.opendata.arcgis.com/datasets/cct::schools.geojson" | head -20
```

## 🔧 Troubleshooting

### Data Source Issues
If data sources return 500 errors:
1. Check the URLs in `app/core/portal_client.py`
2. Verify ArcGIS Open Data portal is accessible
3. Update URLs to working endpoints

### Dependency Issues
If GIS libraries won't install:
1. Ensure sufficient disk space (>5GB free)
2. Use Python 3.11+ in a virtual environment
3. Consider using Docker for isolated environment

### Mock Data Generation
If logs show "Generating mock data":
1. This violates the 100% real data policy
2. Check `app/core/data_loader.py` for fallback logic
3. Ensure system fails gracefully instead of generating fake data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **City of Cape Town** - Open data portal and GIS services
- **Western Cape Government** - Spatial data and planning information
- **OpenStreetMap** - Base map data
- **Leaflet** - Mapping library
- **FastAPI** - Web framework

## 📞 Support

For support, email support@capetowngis.org or join our [Discord community](https://discord.gg/capetowngis).

---

**Built with ❤️ for Cape Town's urban planning community**
