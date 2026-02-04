# Validate GeoJSON FeatureCollection

**Context requirements:**
- GeoJSON payload and expected geometry types
- CRS expectations (default WGS84)
- Required properties schema
- Size/performance considerations

**Prompt structure:**
- Validate against RFC 7946 (type, coordinates order, bbox optional)
- Check coordinate ranges and geometry validity
- Enforce required properties and data types
- Provide TypeScript typings and Zod/Pydantic validators where relevant
- Suggest simplification or tiling if oversized

**Example usage:**
- "Validate services FeatureCollection for null geometry and property types"
- "Add Zod schema for GeoJSON point collection"
