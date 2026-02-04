# Spatial Patterns Guide: CRS Handling

## Storage CRS
- Always store geometries in EPSG 4326 WGS84
- Longitude first then latitude for coordinates
- Valid longitude range -180 to 180
- Valid latitude range -90 to 90

## Calculation CRS
- Transform to EPSG 32734 UTM Zone 34 South for Cape Town
- Use projected CRS for distance and area calculations
- Buffer operations require projected coordinates
- Transform back to WGS84 for storage

## Transformation Patterns
- Use GeoPandas `to_crs` method not manual calculation
- Specify CRS on read using `crs` parameter
- Validate CRS matches expected before operations
- Log CRS transformations for debugging
- Test transformation accuracy with known points

## Validation
- Check coordinates are within valid ranges
- Verify geometries are valid using `is_valid`
- Handle antimeridian crossing for global data
- Test edge cases at CRS boundaries
- Document expected CRS in docstrings
