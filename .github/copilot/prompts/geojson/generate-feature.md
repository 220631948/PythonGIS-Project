# Generate GeoJSON Feature with Properties

**Context requirements:**
- Geometry type needed: Point, LineString, Polygon, etc.
- Coordinate reference system: default WGS84 EPSG 4326
- Property schema definition
- Validation requirements

**Prompt structure:**
- Specify geometry type and coordinates
- Define properties interface if TypeScript
- Request proper CRS if not WGS84
- Ask for validation against RFC 7946
- Include type annotations

**Example usage:**
- Generate a Point feature for coordinates -33.92, 18.42
- Create a Polygon feature with properties containing name and area
- Generate a FeatureCollection of clinics with properties
