# Changelog

All notable changes to the Cape Town GeoHub project are documented in this file.

## [1.1.0] - 2026-01-19

### Added
- **Collaborative Spatial Review Tools**: New API and frontend panel for location-based comments, annotations, and threaded discussions.
- **Data Export & Reporting**: Support for GeoJSON, CSV, XLSX, and KML exports via new `export_api` and `ExportPanel`.
- **Field Data Support**: Mobile-optimized forms for data capture with offline sync capabilities and photo upload support.
- **Advanced Spatial Analysis**: Added Viewshed analysis, Topology validation, and Network routing (isochrones).
- **Metadata Catalog**: Searchable spatial metadata catalog with dataset discovery and attribute filtering.
- **Real-Time Data Integration**: Support for live feeds (traffic, weather, service disruptions) with auto-refresh and timestamps.
- **UX Enhancements**: 
  - Shareable map state via URL persistence.
  - Tabbed Sidebar interface for easier feature navigation.
  - Improved Header with quick actions for Export, Dashboard, and Offline Data.
  - Keyboard shortcuts for power users.
- **Comprehensive E2E Testing**: 45 new automated tests covering all advanced feature integrations.

### Fixed
- **Frontend Refactoring**: Fixed critical syntax errors and extensive code duplication in `App.jsx` and `Header.jsx`.
- **MapView Integration**: Fixed missing props and broken logic for route rendering and active filtering.
- **API Registry**: Ensured all 6 new advanced feature routers are correctly registered in `main.py`.

## [1.0.1] - 2026-01-19

### Fixed

#### Backend (Python/FastAPI)
- **Deprecated FastAPI Event Handler**: Replaced deprecated `@app.on_event("startup")` with modern `lifespan` context manager pattern for handling application startup/shutdown events
- **Exception Handler Response**: Fixed `geohub_exception_handler` to return proper `JSONResponse` with HTTP status codes instead of plain dictionaries
- **Import Order (PEP8)**: Moved `import json` from bottom of `data_loader.py` to the top with other imports, following Python best practices
- **Unused Imports**: Removed unused imports across multiple files:
  - `data_loader.py`: Removed unused `os`, `Path`, `Optional`, `Any`, `shape`, `InvalidGeometryError`
  - `exceptions.py`: Removed unused `HTTPException`, `status`
  - `transport.py`: Removed unused `List` from typing imports
  - `main.py`: Removed unused `os` import from health check function
- **GIS Distance Calculation**: Fixed warning in `transport.py` where distance calculation was incorrectly using geographic CRS. Removed redundant degree-distance calculation line that was superseded by projected CRS calculation

#### Frontend (React/Vite)
- **Vite Dev Server Proxy**: Added API proxy configuration to `vite.config.js` to forward `/api` requests to backend during development
- **React Hooks Order**: Fixed hook ordering in `useOfflineData.js` where `processQueue` was accessed before declaration
- **React useEffect Best Practices**: Refactored `useUserPreferences` hook to avoid calling setState directly within useEffect, using proper initialization pattern instead
- **Unused Import**: Removed unused `useEffect` import from `useUrlState.js`
- **Switch Statement Default Case**: Added default case to switch statement in `useActionQueue`

#### Configuration & Dependencies
- **requirements.txt**: Added missing `pydantic-settings` package (required by `config.py`), added `pytest` and `httpx` for testing
- **Dockerfile**: Replaced template "hello world" Dockerfile with proper Python/FastAPI configuration including:
  - Multi-stage build for smaller image
  - GIS library dependencies (GDAL, GEOS, PROJ)
  - Non-privileged user for security
  - Health check configuration
  - Proper volume mounts for data persistence
- **compose.yaml**: Updated Docker Compose configuration with:
  - Port exposure (8000:8000)
  - Environment variables
  - Volume mounts for persistent data
  - Health check configuration

### Added

#### Test Suite
- **test_spatial_utils.py**: New comprehensive tests for spatial utility functions:
  - Point-in-polygon checks
  - Buffer creation with CRS handling
  - Distance calculations
  - Geometry simplification
- **test_endpoints.py**: New API endpoint tests covering:
  - Health, config, and stats endpoints
  - Services, transport, environment endpoints
  - Spatial tools (buffer, point-in-polygon)
  - Safety, land use, utilities endpoints
  - Infrastructure and portal endpoints
  - Static file and cache endpoints
- **test_config.py**: New configuration tests covering:
  - Application settings validation
  - Logging configuration
  - Data URL validation
  - Cache and server settings

### Improved

- **Code Documentation**: Added descriptive comments throughout modified code
- **Type Safety**: Improved type hints in exception handling
- **Error Messages**: More descriptive error responses from exception handler

## [1.0.0] - Initial Release

- Initial release of Cape Town GeoHub
- FastAPI backend with GIS analysis capabilities
- React frontend with Leaflet mapping
- Integration with City of Cape Town Open Data Portal
- PWA support for offline functionality
