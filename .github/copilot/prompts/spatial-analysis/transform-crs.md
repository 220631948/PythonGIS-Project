# Generate CRS Transformation Flow

**Context requirements:**
- Source CRS and target CRS (default 4326 -> 32734 or vice versa)
- Geometry type and sample coordinates
- Performance constraints (size of dataset)
- Validation expectations

**Prompt structure:**
- Read/construct geometry with explicit CRS
- Use GeoPandas/pyproj `to_crs` (no manual math)
- Validate geometry (`is_valid`) and coordinate ranges before/after
- Handle antimeridian or polar edge cases if relevant
- Return GeoJSON/RFC 7946 if output is WGS84

**Example usage:**
- "Transform FeatureCollection from EPSG:3857 to 4326 for frontend"
- "Project polygons to 32734 for area calculations then back to 4326"
