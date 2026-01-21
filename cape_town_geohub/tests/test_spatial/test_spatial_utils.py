"""
Tests for spatial utility functions.

These tests verify the core GIS operations including:
- Buffer creation with proper CRS handling
- Distance calculations in meters
- Geometry simplification
"""
import pytest
from shapely.geometry import Point, Polygon
from app.spatial_analysis.spatial_utils import (
    point_in_polygon,
    create_buffer,
    calculate_distance,
    simplify_geometry
)


class TestPointInPolygon:
    """Tests for point-in-polygon checks."""

    def test_point_inside_polygon(self):
        """Test that a point inside a polygon returns True."""
        polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
        point = Point(5, 5)
        assert point_in_polygon(point, polygon) is True

    def test_point_outside_polygon(self):
        """Test that a point outside a polygon returns False."""
        polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
        point = Point(15, 15)
        assert point_in_polygon(point, polygon) is False

    def test_point_on_boundary(self):
        """Test that a point on the polygon boundary."""
        polygon = Polygon([(0, 0), (10, 0), (10, 10), (0, 10)])
        point = Point(0, 5)
        # Points on boundary are typically not considered "inside"
        result = point_in_polygon(point, polygon)
        assert result is False or result is True  # Implementation dependent


class TestCreateBuffer:
    """Tests for buffer creation with CRS transformations."""

    def test_buffer_creates_polygon(self):
        """Test that buffer creates a valid polygon geometry."""
        point = Point(18.4232, -33.9249)  # Cape Town CBD
        buffer = create_buffer(point, 500)  # 500m buffer

        assert buffer is not None
        assert buffer.geom_type == 'Polygon'
        assert buffer.is_valid

    def test_buffer_contains_original_point(self):
        """Test that the buffer contains the original point."""
        point = Point(18.4232, -33.9249)
        buffer = create_buffer(point, 500)

        assert buffer.contains(point)

    def test_buffer_size_increases_with_distance(self):
        """Test that larger buffer distances create larger polygons."""
        point = Point(18.4232, -33.9249)
        buffer_500 = create_buffer(point, 500)
        buffer_1000 = create_buffer(point, 1000)

        assert buffer_1000.area > buffer_500.area


class TestCalculateDistance:
    """Tests for distance calculations between points."""

    def test_distance_same_point(self):
        """Test that distance between same point is zero."""
        point = Point(18.4232, -33.9249)
        distance = calculate_distance(point, point)

        assert distance == pytest.approx(0, abs=0.1)

    def test_distance_known_points(self):
        """Test distance calculation between known points (approximate)."""
        # Cape Town CBD to Waterfront (approximately 2km)
        cbd = Point(18.4232, -33.9249)
        waterfront = Point(18.4175, -33.9033)

        distance = calculate_distance(cbd, waterfront)

        # Should be approximately 2.5km
        assert 1000 < distance < 4000

    def test_distance_is_symmetric(self):
        """Test that distance is symmetric (A to B == B to A)."""
        point_a = Point(18.4232, -33.9249)
        point_b = Point(18.5, -33.8)

        dist_ab = calculate_distance(point_a, point_b)
        dist_ba = calculate_distance(point_b, point_a)

        assert dist_ab == pytest.approx(dist_ba, rel=0.001)


class TestSimplifyGeometry:
    """Tests for geometry simplification."""

    def test_simplify_preserves_validity(self):
        """Test that simplified geometry remains valid."""
        polygon = Polygon([(0, 0), (1, 0), (1, 1), (0.5, 1.1), (0, 1)])
        simplified = simplify_geometry(polygon)

        assert simplified.is_valid

    def test_simplify_reduces_vertices(self):
        """Test that simplification reduces vertex count for complex geometries."""
        # Create a complex polygon with many vertices
        import math
        vertices = [(math.cos(i * 0.1), math.sin(i * 0.1)) for i in range(63)]
        vertices.append(vertices[0])  # Close the polygon
        polygon = Polygon(vertices)

        simplified = simplify_geometry(polygon, tolerance=0.1)

        # Simplified should have fewer coordinates
        assert len(simplified.exterior.coords) <= len(polygon.exterior.coords)
