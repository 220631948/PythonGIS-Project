# Technical Documentation - Cape Town GeoHub

## Architecture Overview
Cape Town GeoHub follows a modular architecture with a FastAPI backend and a React single-page application (SPA) frontend.

### Backend (Python/FastAPI)
- **FastAPI**: Provides the REST API and serves static frontend files.
- **GeoPandas & Shapely**: Core engines for spatial data processing and analysis.
- **DataLoader**: Handles automatic fetching, reprojection (to EPSG:4326), and caching of open datasets.
- **CacheManager**: Manages data persistence and metadata tracking in the `data/` directory.
- **Analyzers**: Domain-specific classes (Services, Transport, etc.) that inherit from `BaseAnalyzer`.

### Frontend (React/Leaflet)
- **React 19**: Component-based UI library.
- **Leaflet**: Map rendering engine.
- **PWA**: Service worker implementation for offline support and asset caching.
- **IndexedDB**: Local storage for custom overlays and action queuing.

## Spatial Analysis Algorithms

### Service Access Score
Calculates proximity of informal settlements to water and electricity points.
- Inverse distance weighting.
- Aggregated at settlement level.

### Transport Accessibility
Multi-ring buffer analysis around a point.
- 800m, 1600m, 2400m buffers.
- Point-in-polygon counting of MyCiTi stops.
- Bonus for proximity to rail stations.

### Flood Risk Analysis
Geometric intersection between suburb polygons and flood zone polygons.
- Percentage area at risk per suburb.

## Data Flow
1. API request received by FastAPI.
2. Analyzer requests dataset from DataLoader.
3. DataLoader checks CacheManager for valid local GeoJSON.
4. If missing/expired, DataLoader downloads from City of Cape Town Open Data Portal.
5. Data is reprojected, simplified, and cached.
6. Analyzer performs spatial operations.
7. Result returned as GeoJSON with analysis metadata.
