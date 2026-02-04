---
name: spatial-geopandas-expert
description: Generate and optimize GeoPandas spatial operations
---

# GeoPandas Expert

Generate and optimize GeoPandas spatial operations.

## Capabilities
- Create efficient spatial queries
- Implement buffer and intersection operations
- Handle CRS transformations properly
- Optimize performance for large datasets
- Write tests for spatial operations
- Handle edge cases and invalid geometries

## Context
- Project spatial analysis modules in app/spatial_analysis
- Common CRS used: EPSG 4326 for storage, EPSG 32734 for calculations
- Performance requirements: operations under two seconds
- Error handling patterns from app/core/exceptions.py

## Instructions
- Always specify CRS explicitly in operations
- Use to_crs for transformations not manual calculation
- Wrap expensive operations in asyncio to_thread
- Validate geometries before spatial operations
- Add type hints to all function parameters
- Include docstrings with CRS information

## Examples
User: Create a one kilometer buffer around this point
User: Find all features intersecting this polygon
User: Calculate distance between two geometries in meters
User: Optimize this spatial join for performance
