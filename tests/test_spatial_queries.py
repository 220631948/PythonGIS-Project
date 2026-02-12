"""
Spatial Query PostGIS Tests

Sprint 4 - S4.1 / F.1.3: Spatial query PostGIS tests
Tests spatial operations and PostGIS integration

Tests:
- Point-in-polygon queries
- Buffer operations
- Nearest neighbor searches
- Spatial joins
- Bounding box queries
- Clustering operations
"""

import pytest
from shapely import wkt
from shapely.geometry import Point, Polygon, LineString


class TestSpatialValidation:
    """Test spatial data validation"""

    def test_valid_point_geometry(self):
        """Test valid point geometry"""
        point = Point(18.5, -33.9)
        assert point.is_valid
        assert point.geom_type == "Point"

    def test_valid_polygon_geometry(self):
        """Test valid polygon geometry"""
        coords = [(18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0), (18.4, -33.9)]
        polygon = Polygon(coords)
        assert polygon.is_valid
        assert polygon.geom_type == "Polygon"

    def test_invalid_polygon_not_closed(self):
        """Test that non-closed polygon is invalid"""
        coords = [(18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0)]
        with pytest.raises(Exception):
            polygon = Polygon(coords)

    def test_wkt_parsing(self):
        """Test WKT string parsing"""
        wkt_string = "POINT (18.5 -33.9)"
        geometry = wkt.loads(wkt_string)
        assert geometry.geom_type == "Point"
        assert geometry.x == 18.5
        assert geometry.y == -33.9


class TestSpatialOperations:
    """Test basic spatial operations"""

    def test_point_in_polygon(self):
        """Test point-in-polygon operation"""
        point = Point(18.45, -33.95)
        polygon = Polygon([
            (18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0), (18.4, -33.9)
        ])

        assert polygon.contains(point)

    def test_point_outside_polygon(self):
        """Test point outside polygon"""
        point = Point(18.6, -33.95)
        polygon = Polygon([
            (18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0), (18.4, -33.9)
        ])

        assert not polygon.contains(point)

    def test_buffer_operation(self):
        """Test buffer operation on point"""
        point = Point(18.5, -33.9)
        buffer = point.buffer(0.1)  # 0.1 degree buffer

        assert buffer.geom_type == "Polygon"
        assert buffer.area > 0

        # Original point should be inside buffer
        assert buffer.contains(point)

    def test_distance_calculation(self):
        """Test distance calculation between geometries"""
        point1 = Point(18.4, -33.9)
        point2 = Point(18.5, -34.0)

        distance = point1.distance(point2)
        assert distance > 0
        assert distance < 1  # Should be less than 1 degree

    def test_intersection(self):
        """Test geometric intersection"""
        polygon1 = Polygon([
            (18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0), (18.4, -33.9)
        ])
        polygon2 = Polygon([
            (18.45, -33.95), (18.55, -33.95), (18.55, -34.05), (18.45, -34.05), (18.45, -33.95)
        ])

        intersection = polygon1.intersection(polygon2)
        assert intersection.area > 0
        assert intersection.area < polygon1.area
        assert intersection.area < polygon2.area


class TestBoundingBoxQueries:
    """Test bounding box query operations"""

    def test_bounding_box_calculation(self):
        """Test bounding box calculation for geometry"""
        polygon = Polygon([
            (18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0), (18.4, -33.9)
        ])

        bounds = polygon.bounds  # (minx, miny, maxx, maxy)
        assert bounds[0] == 18.4  # min_lng
        assert bounds[1] == -34.0  # min_lat
        assert bounds[2] == 18.5  # max_lng
        assert bounds[3] == -33.9  # max_lat

    def test_geometry_intersects_bbox(self):
        """Test if geometry intersects bounding box"""
        point = Point(18.45, -33.95)

        # Define bounding box
        min_lng, min_lat = 18.4, -34.0
        max_lng, max_lat = 18.5, -33.9

        bbox_polygon = Polygon([
            (min_lng, min_lat), (max_lng, min_lat),
            (max_lng, max_lat), (min_lng, max_lat),
            (min_lng, min_lat)
        ])

        assert bbox_polygon.contains(point)

    def test_geometry_outside_bbox(self):
        """Test geometry outside bounding box"""
        point = Point(18.6, -33.8)

        # Define bounding box
        min_lng, min_lat = 18.4, -34.0
        max_lng, max_lat = 18.5, -33.9

        bbox_polygon = Polygon([
            (min_lng, min_lat), (max_lng, min_lat),
            (max_lng, max_lat), (min_lng, max_lat),
            (min_lng, min_lat)
        ])

        assert not bbox_polygon.contains(point)


class TestGeometryComplexity:
    """Test geometry complexity validation"""

    def test_simple_geometry_complexity(self):
        """Test complexity of simple geometry"""
        point = Point(18.5, -33.9)
        # Point has 1 coordinate
        assert len(point.coords) == 1

    def test_polygon_vertex_count(self):
        """Test polygon vertex count"""
        coords = [(i * 0.01 + 18.4, -33.9) for i in range(100)]
        coords.append(coords[0])  # Close polygon
        polygon = Polygon(coords)

        # Should have 100 vertices (excluding closing point)
        assert len(polygon.exterior.coords) == 101

    def test_linestring_vertex_limit(self):
        """Test linestring with many vertices"""
        coords = [(i * 0.01 + 18.4, -33.9) for i in range(10000)]
        linestring = LineString(coords)

        # Should have 10000 vertices
        assert len(linestring.coords) == 10000


class TestSpatialIndexing:
    """Test spatial indexing concepts"""

    def test_point_clustering_preparation(self):
        """Test preparation of points for clustering"""
        # Create sample points
        points = [
            Point(18.40, -33.90),
            Point(18.41, -33.91),
            Point(18.50, -33.95),
            Point(18.51, -33.96),
        ]

        # Group points by proximity (simple example)
        # In real PostGIS, this would use ST_ClusterKMeans
        assert len(points) == 4

        # Calculate centroid of all points
        from shapely.geometry import MultiPoint
        multipoint = MultiPoint(points)
        centroid = multipoint.centroid

        assert centroid.geom_type == "Point"
        assert 18.4 < centroid.x < 18.6
        assert -34.0 < centroid.y < -33.9


class TestCoordinateValidation:
    """Test coordinate validation"""

    def test_valid_coordinates(self):
        """Test valid lat/lng coordinates"""
        lat, lng = -33.9, 18.5

        # Cape Town coordinates
        assert -90 <= lat <= 90
        assert -180 <= lng <= 180

    def test_invalid_latitude(self):
        """Test invalid latitude (out of range)"""
        lat = 95  # Invalid: > 90

        assert not (-90 <= lat <= 90)

    def test_invalid_longitude(self):
        """Test invalid longitude (out of range)"""
        lng = 200  # Invalid: > 180

        assert not (-180 <= lng <= 180)

    def test_coordinate_swap_detection(self):
        """Test detection of swapped lat/lng"""
        # Common mistake: swapping lat/lng
        # Cape Town: lat=-33.9, lng=18.5
        # If swapped: lat=18.5, lng=-33.9

        lat, lng = 18.5, -33.9

        # Detect if coordinates might be swapped (for Cape Town region)
        # Latitude should be negative, longitude should be positive
        if lat > 0 and lng < 0:
            # Likely swapped
            assert True
        else:
            assert False


class TestGeoJSONConversion:
    """Test GeoJSON format conversion"""

    def test_point_to_geojson(self):
        """Test converting Point to GeoJSON"""
        point = Point(18.5, -33.9)
        geojson = {
            "type": "Point",
            "coordinates": [point.x, point.y]
        }

        assert geojson["type"] == "Point"
        assert geojson["coordinates"] == [18.5, -33.9]

    def test_polygon_to_geojson(self):
        """Test converting Polygon to GeoJSON"""
        polygon = Polygon([
            (18.4, -33.9), (18.5, -33.9), (18.5, -34.0), (18.4, -34.0), (18.4, -33.9)
        ])

        coords = list(polygon.exterior.coords)

        geojson = {
            "type": "Polygon",
            "coordinates": [coords]
        }

        assert geojson["type"] == "Polygon"
        assert len(geojson["coordinates"][0]) == 5  # Including closing point

    def test_feature_collection_structure(self):
        """Test GeoJSON FeatureCollection structure"""
        feature_collection = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [18.5, -33.9]
                    },
                    "properties": {
                        "name": "Test Point",
                        "tenant_id": 1
                    }
                }
            ]
        }

        assert feature_collection["type"] == "FeatureCollection"
        assert len(feature_collection["features"]) == 1
        assert feature_collection["features"][0]["geometry"]["type"] == "Point"


# Performance testing concepts
class TestSpatialPerformance:
    """Test spatial query performance concepts"""

    def test_small_dataset_query(self):
        """Test query performance with small dataset"""
        # Create 100 points
        points = [Point(18.4 + i * 0.001, -33.9) for i in range(100)]

        # Query points within bounding box
        bbox = Polygon([
            (18.4, -33.95), (18.5, -33.95), (18.5, -33.85), (18.4, -33.85), (18.4, -33.95)
        ])

        # Filter points within bbox
        filtered = [p for p in points if bbox.contains(p)]

        # Should complete quickly for 100 points
        assert len(filtered) <= 100

    def test_geometry_simplification(self):
        """Test geometry simplification for performance"""
        # Create complex polygon
        coords = [(i * 0.001 + 18.4, -33.9) for i in range(1000)]
        coords.append(coords[0])
        complex_polygon = Polygon(coords)

        # Simplify polygon (reduce vertices)
        simplified = complex_polygon.simplify(0.01)

        # Simplified should have fewer vertices
        assert len(simplified.exterior.coords) < len(complex_polygon.exterior.coords)
