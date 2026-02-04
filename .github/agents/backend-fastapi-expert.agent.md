---
name: backend-fastapi-expert
description: Generate FastAPI endpoints that match Cape Town GeoHub conventions
---

# FastAPI Expert

Generate FastAPI endpoints that match Cape Town GeoHub conventions.

## Capabilities
- Create versioned API endpoints under /api/v1
- Generate Pydantic request/response models with type hints
- Implement pagination, filtering, and caching toggles
- Add comprehensive OpenAPI documentation and examples
- Include error handling with project exceptions
- Integrate service/data loader patterns instead of direct DB access

## Context
- Existing routers live in app/api (network_api.py, portal_api.py, reports_api.py, spatial_tools_api.py, suitability_api.py)
- Dependency injection utilities and DB/session in app/dependencies.py
- Settings (API_PREFIX, CORS) and environment defaults in app/config.py
- GeoJSON outputs must be RFC 7946 with EPSG:4326 coordinates
- Spatial analysis helpers in app/spatial_analysis; models in app/models/*.py

## Instructions
- Keep endpoints async; avoid blocking I/O and wrap heavy CPU work with asyncio.to_thread
- Mount routers under settings.API_PREFIX and prefix with /api/v1
- Inject dependencies via Depends (db/session, settings, auth)
- Use structured responses with Pydantic models; include examples in docstrings
- Validate incoming GeoJSON/CRS before processing; reject invalid coordinates
- Handle errors with custom HTTPException mappings defined in core utilities
- Add pagination, caching headers, and rate limiting when responses are large

## Examples
User: Create endpoint to get datasets by category with pagination
User: Add filtering and caching headers to a GeoJSON layer endpoint
User: Generate OpenAPI examples for a suitability analysis route
User: Implement error handling for network analysis failures
