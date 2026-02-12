# GIS Project Improvement Prompts

### 1. Performance: Vector Tile Optimization
"Analyze the current `MVT` (Mapbox Vector Tile) generation logic in `app/api/v1/tiles.py`. Suggest SQL optimizations using `ST_AsMVT` and `ST_AsMVTGeom` to reduce backend CPU usage. Focus on simplification (ST_SimplifyPreserveTopology) at lower zoom levels."

### 2. DX: Automatic Migration Testing
"Create a shell script in `scripts/test-migrations.sh` that spins up a temporary PostGIS Docker container, applies all `alembic` migrations, and runs a basic 'ST_IsValid' check on all geometry columns."

### 3. Feature: Spatial Query Caching (Advanced)
"Design a Redis-based caching strategy for spatial bounding box queries. The key should be a hash of the GeoJSON polygon, and the value should be the serialized MVT. Define the cache invalidation logic when underlying layers are updated."

### 4. Infrastructure: Geoserver/MapProxy Integration
"Generate a `docker-compose.yml` fragment to add `MapProxy` as a caching frontend to our FastAPI GIS service. Configure it to serve TMS and WMTS layers derived from our internal API."
