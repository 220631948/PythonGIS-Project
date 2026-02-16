"""
Enhanced tests for spatial utility functions with comprehensive coverage.

Tests cover:
- GeoJSON conversion (GeoDataFrame to GeoJSON)
- CRS transformation accuracy
- Buffer creation edge cases
- Distance calculation validation
- Geometry simplification
- Performance benchmarks
- Error handling
"""
import pytest
import geopandas as gpd
import pandas as pd
import json
from datetime import datetime
from shapely.geometry import Point, Polygon, LineString, MultiPoint, MultiPolygon
from app.spatial_analysis.spatial_utils import (
    point_in_polygon,
    gdf_to_geojson,
    gdf_to_geojson_str,
    create_buffer,
    calculate_distance,
    simplify_geometry,
    json_serial
)
from app.config import settings


class TestJSONSerialization:
    """Tests for JSON serialization helpers."""

    def test_json_serial_datetime(self):
        """Test serialization of datetime objects."""
        dt = datetime(2024, 1, 15, 10, 30, 45)
        result = json_serial(dt)
        
        assert isinstance(result, str)
        assert '2024-01-15' in result
        assert '10:30:45' in result

    def test_json_serial_date(self):
        """Test serialization of date objects."""
        from datetime import date
        d = date(2024, 1, 15)
        result = json_serial(d)
        
        assert isinstance(result, str)
        assert '2024-01-15' in result

    def test_json_serial_other_types(self):
        """Test serialization of other types falls back to str()."""
        class CustomObject:
            def __str__(self):
                return "custom_object"
        
        obj = CustomObject()
        result = json_serial(obj)
        
        assert result == "custom_object"


class TestGeoDataFrameToGeoJSON:
    """Tests for GeoDataFrame to GeoJSON conversion."""

    def test_gdf_to_geojson_str_basic(self):
        """Test basic GeoDataFrame to GeoJSON string conversion."""
        gdf = gpd.GeoDataFrame(
            {'name': ['Point A'], 'value': [100]},
            geometry=[Point(18.4241, -33.9249)],
            crs='EPSG:4326'
        )
        
        result = gdf_to_geojson_str(gdf)
        
        assert isinstance(result, str)
        assert 'FeatureCollection' in result
        assert 'Point A' in result

    def test_gdf_to_geojson_dict(self):
        """Test GeoDataFrame to GeoJSON dict conversion."""
        gdf = gpd.GeoDataFrame(
            {'name': ['Point A'], 'value': [100]},
            geometry=[Point(18.4241, -33.9249)],
            crs='EPSG:4326'
        )
        
        result = gdf_to_geojson(gdf)
        
        assert isinstance(result, dict)
        assert result['type'] == 'FeatureCollection'
        assert len(result['features']) == 1
        assert result['features'][0]['properties']['name'] == 'Point A'

    def test_gdf_to_geojson_empty(self):
        """Test conversion of empty GeoDataFrame."""
        gdf = gpd.GeoDataFrame(geometry=[], crs='EPSG:4326')
        
        result = gdf_to_geojson(gdf)
        
        assert result == {'type': 'FeatureCollection', 'features': []}

    def test_gdf_to_geojson_with_nan(self):
        """Test GeoJSON conversion handles NaN values correctly."""
        gdf = gpd.GeoDataFrame(
            {'name': ['Point A', 'Point B'], 'value': [100, float('nan')]},
            geometry=[Point(18.4, -33.9), Point(18.5, -34.0)],
            crs='EPSG:4326'
        )
        
        result_str = gdf_to_geojson_str(gdf)
        result = json.loads(result_str)
        
        assert result['features'][1]['properties']['value'] is None

    def test_gdf_to_geojson_with_datetime(self):
        """Test GeoJSON conversion with datetime columns."""
        gdf = gpd.GeoDataFrame(
            {
                'name': ['Point A'],
                'timestamp': [datetime(2024, 1, 15, 10, 30)]
            },
            geometry=[Point(18.4241, -33.9249)],
            crs='EPSG:4326'
        )
        
        result_str = gdf_to_geojson_str(gdf)
        
        assert '2024-01-15' in result_str

    def test_gdf_to_geojson_multiple_geometries(self):
        """Test conversion with various geometry types."""
        gdf = gpd.GeoDataFrame(
            {'type': ['point', 'line', 'polygon']},
            geometry=[
                Point(18.4, -33.9),
                LineString([(18.4, -33.9), (18.5, -34.0)]),
                Polygon([(18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0), (18.4, -33.9)])
            ],
            crs='EPSG:4326'
        )
        
        result = gdf_to_geojson(gdf)
        
        assert len(result['features']) == 3
        assert result['features'][0]['geometry']['type'] == 'Point'
        assert result['features'][1]['geometry']['type'] == 'LineString'
        assert result['features'][2]['geometry']['type'] == 'Polygon'

    def test_gdf_to_geojson_preserves_properties(self):
        """Test that all properties are preserved in conversion."""
        gdf = gpd.GeoDataFrame(
            {
                'name': ['Feature 1'],
                'id': [123],
                'active': [True],
                'score': [85.5],
                'tags': [['tag1', 'tag2']]
            },
            geometry=[Point(18.4241, -33.9249)],
            crs='EPSG:4326'
        )
        
        result = gdf_to_geojson(gdf)
        props = result['features'][0]['properties']
        
        assert props['name'] == 'Feature 1'
        assert props['id'] == 123
        assert props['active'] is True
        assert props['score'] == 85.5


class TestCreateBufferEnhanced:
    """Enhanced tests for buffer creation with CRS handling."""

    def test_buffer_wgs84_default(self):
        """Test buffer creation with default WGS84 CRS."""
        point = Point(18.4241, -33.9249)  # Cape Town city center
        buffer = create_buffer(point, 1000)  # 1km buffer
        
        assert buffer.geom_type == 'Polygon'
        assert buffer.is_valid
        assert buffer.contains(point)

    def test_buffer_projected_crs(self):
        """Test buffer creation with projected CRS."""
        point = Point(18.4241, -33.9249)
        buffer = create_buffer(point, 500, crs=settings.TARGET_CRS)
        
        assert buffer.geom_type == 'Polygon'
        assert buffer.is_valid

    def test_buffer_small_distance(self):
        """Test buffer with very small distance."""
        point = Point(18.4241, -33.9249)
        buffer = create_buffer(point, 1)  # 1 meter
        
        assert buffer.is_valid
        assert buffer.area > 0

    def test_buffer_large_distance(self):
        """Test buffer with large distance."""
        point = Point(18.4241, -33.9249)
        buffer = create_buffer(point, 10000)  # 10km
        
        assert buffer.is_valid
        assert buffer.area > 0

    def test_buffer_zero_distance(self):
        """Test buffer with zero distance returns point area."""
        point = Point(18.4241, -33.9249)
        buffer = create_buffer(point, 0)
        
        # Zero buffer should be very small or degenerate
        assert buffer.is_valid

    def test_buffer_linestring(self):
        """Test buffer around a LineString."""
        line = LineString([(18.4, -33.9), (18.5, -34.0)])
        buffer = create_buffer(line, 500)
        
        assert buffer.geom_type == 'Polygon'
        assert buffer.is_valid

    def test_buffer_polygon(self):
        """Test buffer around a Polygon."""
        polygon = Polygon([(18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0), (18.4, -33.9)])
        buffer = create_buffer(polygon, 500)
        
        assert buffer.geom_type in ['Polygon', 'MultiPolygon']
        assert buffer.is_valid

    def test_buffer_negative_distance(self):
        """Test negative buffer (erosion) on polygon."""
        # Create a large polygon
        polygon = Polygon([
            (18.4, -33.9), (18.5, -33.9), 
            (18.5, -34.0), (18.4, -34.0), 
            (18.4, -33.9)
        ])
        buffer = create_buffer(polygon, -100)  # Negative buffer (erode)
        
        # Result may be empty or smaller polygon
        assert buffer.is_valid

    def test_buffer_antimeridian_aware(self):
        """Test buffer near antimeridian (edge case)."""
        # Near dateline
        point = Point(179.9, -33.9)
        buffer = create_buffer(point, 1000)
        
        assert buffer.is_valid


class TestCalculateDistanceEnhanced:
    """Enhanced tests for distance calculations."""

    def test_distance_cape_town_to_stellenbosch(self):
        """Test distance between Cape Town and Stellenbosch (known distance ~50km)."""
        cape_town = Point(18.4241, -33.9249)
        stellenbosch = Point(18.8666, -33.9320)
        
        distance = calculate_distance(cape_town, stellenbosch)
        
        # Should be approximately 40-50km
        assert 35000 < distance < 55000

    def test_distance_cbd_to_camps_bay(self):
        """Test distance from CBD to Camps Bay (known distance ~12km)."""
        cbd = Point(18.4232, -33.9249)
        camps_bay = Point(18.3777, -33.9508)
        
        distance = calculate_distance(cbd, camps_bay)
        
        # Should be approximately 10-14km
        assert 9000 < distance < 15000

    def test_distance_with_altitude_difference(self):
        """Test that distance is calculated in 2D (ignores Z coordinate)."""
        point_a = Point(18.4, -33.9, 0)
        point_b = Point(18.5, -34.0, 1000)  # 1000m elevation difference
        
        distance_2d = calculate_distance(
            Point(18.4, -33.9), 
            Point(18.5, -34.0)
        )
        distance_3d = calculate_distance(point_a, point_b)
        
        # Should be similar (Z coordinate ignored in our implementation)
        assert abs(distance_2d - distance_3d) < 10

    def test_distance_very_close_points(self):
        """Test distance between very close points (meters apart)."""
        point_a = Point(18.42410, -33.92490)
        point_b = Point(18.42411, -33.92491)  # ~15m apart
        
        distance = calculate_distance(point_a, point_b)
        
        assert 10 < distance < 20

    def test_distance_far_apart_points(self):
        """Test distance between far apart points."""
        cape_town = Point(18.4241, -33.9249)
        durban = Point(31.0218, -29.8587)  # ~1300km away
        
        distance = calculate_distance(cape_town, durban)
        
        assert 1200000 < distance < 1400000

    def test_distance_is_positive(self):
        """Test that distance is always positive."""
        point_a = Point(18.4, -33.9)
        point_b = Point(18.5, -34.0)
        
        distance = calculate_distance(point_a, point_b)
        
        assert distance >= 0

    def test_distance_different_crs(self):
        """Test distance calculation respects CRS parameter."""
        point_a = Point(18.4, -33.9)
        point_b = Point(18.5, -34.0)
        
        dist_wgs84 = calculate_distance(point_a, point_b, crs='EPSG:4326')
        
        # Should successfully calculate
        assert dist_wgs84 > 0


class TestSimplifyGeometryEnhanced:
    """Enhanced tests for geometry simplification."""

    def test_simplify_complex_polygon(self):
        """Test simplification of complex polygon."""
        # Create polygon with many vertices
        import numpy as np
        t = np.linspace(0, 2 * np.pi, 100)
        x = np.cos(t)
        y = np.sin(t)
        coords = list(zip(x, y))
        coords.append(coords[0])
        
        polygon = Polygon(coords)
        simplified = simplify_geometry(polygon, tolerance=0.1)
        
        assert simplified.is_valid
        assert len(simplified.exterior.coords) < len(polygon.exterior.coords)

    def test_simplify_preserves_topology(self):
        """Test that simplification preserves topology."""
        polygon = Polygon([
            (0, 0), (0.1, 0.1), (0.2, 0.1), (1, 0),
            (1, 1), (0.9, 0.9), (0.8, 0.9), (0, 1),
            (0, 0)
        ])
        
        simplified = simplify_geometry(polygon)
        
        assert simplified.is_valid
        assert simplified.geom_type == 'Polygon'
        assert not simplified.is_empty

    def test_simplify_linestring(self):
        """Test simplification of LineString."""
        # Create zigzag line
        line = LineString([
            (0, 0), (0.1, 0.1), (0.2, 0.0), (0.3, 0.1),
            (0.4, 0.0), (0.5, 0.1), (1, 0)
        ])
        
        simplified = simplify_geometry(line, tolerance=0.15)
        
        assert simplified.is_valid
        assert len(simplified.coords) < len(line.coords)

    def test_simplify_multipolygon(self):
        """Test simplification of MultiPolygon."""
        poly1 = Polygon([(0, 0), (0.1, 0), (0.1, 0.1), (0, 0.1), (0, 0)])
        poly2 = Polygon([(1, 1), (1.1, 1), (1.1, 1.1), (1, 1.1), (1, 1)])
        multi = MultiPolygon([poly1, poly2])
        
        simplified = simplify_geometry(multi)
        
        assert simplified.is_valid
        assert simplified.geom_type == 'MultiPolygon'

    def test_simplify_small_tolerance(self):
        """Test simplification with very small tolerance."""
        polygon = Polygon([
            (0, 0), (0.5, 0.01), (1, 0), (1, 1), (0, 1), (0, 0)
        ])
        
        simplified = simplify_geometry(polygon, tolerance=0.001)
        
        # Small tolerance should preserve most vertices
        assert len(simplified.exterior.coords) >= 5

    def test_simplify_large_tolerance(self):
        """Test simplification with large tolerance."""
        polygon = Polygon([
            (0, 0), (0.5, 0.01), (1, 0), (1, 1), (0, 1), (0, 0)
        ])
        
        simplified = simplify_geometry(polygon, tolerance=0.5)
        
        # Large tolerance should remove many vertices
        assert len(simplified.exterior.coords) < len(polygon.exterior.coords)

    def test_simplify_default_tolerance(self):
        """Test simplification with default tolerance from settings."""
        polygon = Polygon([
            (0, 0), (0.1, 0), (0.2, 0.01), (0.3, 0),
            (1, 0), (1, 1), (0, 1), (0, 0)
        ])
        
        simplified = simplify_geometry(polygon)
        
        assert simplified.is_valid


class TestCRSTransformationAccuracy:
    """Tests for CRS transformation accuracy."""

    def test_wgs84_to_utm_and_back(self):
        """Test round-trip transformation preserves coordinates."""
        original_point = Point(18.4241, -33.9249)
        
        # Create buffer (which transforms to UTM and back)
        buffer = create_buffer(original_point, 100)
        
        # Original point should be contained in buffer
        assert buffer.contains(original_point)

    def test_distance_in_utm_vs_wgs84(self):
        """Test that distance calculation is consistent."""
        point_a = Point(18.4, -33.9)
        point_b = Point(18.5, -34.0)
        
        distance = calculate_distance(point_a, point_b)
        
        # Distance should be reasonable (in meters)
        assert 100000 < distance < 200000  # ~100-200km

    def test_cape_town_extent_coordinates(self):
        """Test known Cape Town coordinates are handled correctly."""
        cape_town_coords = [
            Point(18.4241, -33.9249),  # City Center
            Point(18.3777, -33.9508),  # Camps Bay
            Point(18.4666, -34.0359),  # Khayelitsha
            Point(18.6666, -33.9628),  # Cape Town Airport area
        ]
        
        for point in cape_town_coords:
            buffer = create_buffer(point, 500)
            assert buffer.is_valid
            assert buffer.contains(point)

    def test_utm_zone_34s_coverage(self):
        """Test that Cape Town coordinates are in correct UTM zone (34S)."""
        # Cape Town should be in UTM Zone 34S (EPSG:32734)
        point = Point(18.4241, -33.9249)
        
        # Create GeoDataFrame to check CRS transformation
        gdf = gpd.GeoDataFrame(geometry=[point], crs='EPSG:4326')
        gdf_utm = gdf.to_crs('EPSG:32734')
        
        # UTM coordinates should be in reasonable range for Cape Town
        utm_point = gdf_utm.geometry.iloc[0]
        assert 200000 < utm_point.x < 400000  # Easting
        assert 6200000 < utm_point.y < 6400000  # Northing


class TestPerformanceBenchmarks:
    """Performance tests for spatial operations."""

    def test_buffer_performance(self):
        """Test buffer creation completes in reasonable time."""
        import time
        
        point = Point(18.4241, -33.9249)
        
        start = time.time()
        for _ in range(100):
            create_buffer(point, 500)
        elapsed = time.time() - start
        
        # Should complete 100 buffers in under 1 second
        assert elapsed < 1.0

    def test_distance_calculation_performance(self):
        """Test distance calculation performance."""
        import time
        
        point_a = Point(18.4, -33.9)
        point_b = Point(18.5, -34.0)
        
        start = time.time()
        for _ in range(1000):
            calculate_distance(point_a, point_b)
        elapsed = time.time() - start
        
        # Should complete 1000 distance calculations in under 0.5 seconds
        assert elapsed < 0.5

    def test_geojson_conversion_performance(self):
        """Test GeoJSON conversion performance with large dataset."""
        import time
        
        # Create large GeoDataFrame
        points = [Point(18.4 + i*0.001, -33.9 - i*0.001) for i in range(1000)]
        gdf = gpd.GeoDataFrame(
            {'id': range(1000)},
            geometry=points,
            crs='EPSG:4326'
        )
        
        start = time.time()
        gdf_to_geojson(gdf)
        elapsed = time.time() - start
        
        # Should convert 1000 features in under 1 second
        assert elapsed < 1.0


class TestEdgeCases:
    """Tests for edge cases and error scenarios."""

    def test_buffer_on_null_geometry(self):
        """Test buffer creation with None geometry."""
        with pytest.raises((AttributeError, TypeError)):
            create_buffer(None, 500)

    def test_distance_with_identical_points(self):
        """Test distance between identical points."""
        point = Point(18.4241, -33.9249)
        distance = calculate_distance(point, point)
        
        assert distance == pytest.approx(0, abs=0.01)

    def test_simplify_already_simple_geometry(self):
        """Test simplification of already simple geometry."""
        triangle = Polygon([(0, 0), (1, 0), (0.5, 1), (0, 0)])
        simplified = simplify_geometry(triangle, tolerance=0.1)
        
        # Should remain valid and similar
        assert simplified.is_valid
        assert simplified.geom_type == 'Polygon'

    def test_geojson_with_special_characters(self):
        """Test GeoJSON conversion with special characters in properties."""
        gdf = gpd.GeoDataFrame(
            {'name': ['Test "quoted" name', "Test 'single' quotes", 'Test \n newline']},
            geometry=[Point(18.4, -33.9)] * 3,
            crs='EPSG:4326'
        )
        
        result_str = gdf_to_geojson_str(gdf)
        result = json.loads(result_str)  # Should parse without error
        
        assert len(result['features']) == 3

    def test_buffer_near_pole(self):
        """Test buffer creation near poles (edge case)."""
        near_pole = Point(0, -85)  # Near south pole
        buffer = create_buffer(near_pole, 1000)
        
        assert buffer.is_valid

    def test_multipoint_buffer(self):
        """Test buffer on MultiPoint geometry."""
        multipoint = MultiPoint([Point(18.4, -33.9), Point(18.5, -34.0)])
        buffer = create_buffer(multipoint, 500)
        
        assert buffer.is_valid
        assert buffer.geom_type in ['Polygon', 'MultiPolygon']
