# Example: Creating a spatial buffer query

**User Request**
"Create a function that finds all clinics within one kilometer of a given point"

**Copilot Response**
1. Function signature with type hints
2. CRS transformation to UTM for buffer
3. Buffer operation in meters
4. Spatial intersection query
5. Return type with clinic properties
6. Error handling for invalid geometries
7. Unit test with mock data

```python
async def get_clinics_within_distance(point: Point, distance_meters: float = 1000.0) -> List[Clinic]:
    """Find clinics within distance. Transforms to UTM 34S for calc."""
    # ... implementation ...
```
