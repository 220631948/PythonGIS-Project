from app.spatial_analysis.spatial_utils import calculate_shadow_geometry
from shapely.geometry import Polygon, shape

def test_shadow_geometry_creation():
    """Test that shadow geometry is valid and larger than the building."""
    # 1. Create a simple 10x10 square building
    building = Polygon([(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)])
    building_geojson = mapping(building)
    
    # 2. Calculate shadow for a 20m tall building
    shadow_geojson = calculate_shadow_geometry(
        geometry=building_geojson,
        height=20.0,
        datetime_str="2023-01-01T12:00:00"
    )
    
    # 3. Verify
    shadow_poly = shape(shadow_geojson)
    
    # Shadow should be a polygon
    assert shadow_poly.geom_type == "Polygon"
    
    # Shadow should be valid
    assert shadow_poly.is_valid
    
    # Shadow area should be larger than building area (because it projects out)
    assert shadow_poly.area > building.area

from shapely.geometry import mapping
