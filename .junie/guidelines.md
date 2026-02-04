# Project Guidelines: Cape Town GeoHub

## Project Overview
Cape Town GeoHub is a comprehensive GIS web application designed for urban planning, environmental analysis, and spatial decision-making in Cape Town, South Africa. It integrates data from the City of Cape Town Open Data Portal and provides advanced spatial analysis tools.

### Tech Stack
- **Backend:** Python 3.11+ with FastAPI.
- **Frontend:** React with Vite, using Leaflet for mapping.
- **Spatial Libraries:** GDAL, GEOS, and integration with ArcGIS services.
- **API Documentation:** Swagger UI (FastAPI) available at `/api/docs`.

## Project Structure
The project is organized into two main parts:
- `app/`: Backend FastAPI application.
    - `api/`: API endpoints (portal, suitability, spatial tools).
    - `core/`: Core logic, portal clients, and data loading.
    - `models/`: Data models.
    - `spatial_analysis/`: Modules for site suitability and spatial utilities.
- `frontend/`: React frontend.
    - `src/components/`: UI components (MapView, Sidebar, Panels).
    - `src/api-client.js`: Frontend API communication.
- `tests/`: Test suite for backend and spatial operations.
- `docs/`: Project documentation.

## Development Guidelines

### Building the Project
- **Backend:** Install dependencies via `pip install -r requirements.txt`.
- **Frontend:** Navigate to `frontend/`, run `npm install`, then `npm run build` or `npm run dev`.

### Running Tests
- Use `python test_api.py` for a comprehensive API test suite.
- Run pytest for more granular tests: `pytest tests/`.

### Code Style
- Follow PEP 8 for Python code.
- Use functional components and hooks for React.
- Maintain consistent naming conventions: `snake_case` for Python and `camelCase` for JavaScript.
- Ensure all new API endpoints are documented and included in the health check metrics if applicable.

## Testing Requirements
- When modifying backend logic, always run `python test_api.py` to ensure no regressions.
- New features should include corresponding tests in the `tests/` directory.
