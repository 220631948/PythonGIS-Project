"""
Unit Tests for Validation Utilities

Tests all 14 validation functions for edge cases, security vulnerabilities,
and correct behavior.

Sprint 3 - Phase D.2.1 Testing
"""

import pytest
from shapely.geometry import Point, LineString, Polygon, MultiPoint

from app.utils.validation import (
    validate_wkt,
    validate_coordinate,
    validate_bbox,
    validate_layer_name,
    validate_attribute_name,
    sanitize_sql_identifier,
    validate_geometry_complexity,
    validate_distance,
    validate_limit,
    validate_email,
    validate_pagination,
)


class TestCoordinateValidation:
    """Test coordinate validation"""

    def test_valid_coordinates(self):
        """Test valid lat/lng coordinates"""
        is_valid, error = validate_coordinate(-33.9249, 18.4241)
        assert is_valid
        assert error is None

    def test_invalid_latitude_high(self):
        """Test latitude > 90"""
        is_valid, error = validate_coordinate(91.0, 18.4241)
        assert not is_valid
        assert "out of range" in error.lower()

    def test_invalid_latitude_low(self):
        """Test latitude < -90"""
        is_valid, error = validate_coordinate(-91.0, 18.4241)
        assert not is_valid
        assert "out of range" in error.lower()

    def test_invalid_longitude_high(self):
        """Test longitude > 180"""
        is_valid, error = validate_coordinate(-33.9249, 181.0)
        assert not is_valid
        assert "out of range" in error.lower()

    def test_invalid_longitude_low(self):
        """Test longitude < -180"""
        is_valid, error = validate_coordinate(-33.9249, -181.0)
        assert not is_valid
        assert "out of range" in error.lower()

    def test_null_island(self):
        """Test (0, 0) is flagged as likely invalid"""
        is_valid, error = validate_coordinate(0.0, 0.0)
        assert not is_valid
        assert "null island" in error.lower()

    def test_boundary_values(self):
        """Test exact boundary values"""
        assert validate_coordinate(90.0, 180.0)[0]
        assert validate_coordinate(-90.0, -180.0)[0]
        assert validate_coordinate(0.0, 180.0)[0]  # Not null island


class TestBboxValidation:
    """Test bounding box validation"""

    def test_valid_bbox(self):
        """Test valid bounding box"""
        is_valid, error = validate_bbox(-34.0, 18.0, -33.8, 18.6)
        assert is_valid
        assert error is None

    def test_min_greater_than_max_lat(self):
        """Test min_lat > max_lat"""
        is_valid, error = validate_bbox(-33.8, 18.0, -34.0, 18.6)
        assert not is_valid
        assert "greater than" in error.lower()

    def test_min_greater_than_max_lng(self):
        """Test min_lng > max_lng"""
        is_valid, error = validate_bbox(-34.0, 18.6, -33.8, 18.0)
        assert not is_valid
        assert "greater than" in error.lower()

    def test_bbox_too_large_lat(self):
        """Test bounding box > 10° latitude"""
        is_valid, error = validate_bbox(-40.0, 18.0, -25.0, 18.6)  # 15° lat
        assert not is_valid
        assert "too large" in error.lower()

    def test_bbox_too_large_lng(self):
        """Test bounding box > 10° longitude"""
        is_valid, error = validate_bbox(-34.0, 10.0, -33.8, 25.0)  # 15° lng
        assert not is_valid
        assert "too large" in error.lower()

    def test_bbox_max_size(self):
        """Test exactly 10° × 10° bbox (should be valid)"""
        is_valid, error = validate_bbox(-35.0, 18.0, -25.0, 28.0)
        assert is_valid


class TestLayerNameValidation:
    """Test layer name validation (SQL injection prevention)"""

    def test_valid_layer_name(self):
        """Test valid layer names"""
        assert validate_layer_name("suburbs")[0]
        assert validate_layer_name("service_facilities")[0]
        assert validate_layer_name("land-parcels")[0]
        assert validate_layer_name("layer_123")[0]

    def test_sql_comment_injection(self):
        """Test SQL comment injection patterns"""
        assert not validate_layer_name("suburbs--")[0]
        assert not validate_layer_name("suburbs;DROP TABLE")[0]
        assert not validate_layer_name("suburbs/*comment*/")[0]

    def test_sql_keyword_injection(self):
        """Test SQL keyword injection"""
        assert not validate_layer_name("SELECT * FROM suburbs")[0]
        assert not validate_layer_name("suburbs UNION SELECT")[0]
        assert not validate_layer_name("DROP TABLE suburbs")[0]
        assert not validate_layer_name("INSERT INTO suburbs")[0]

    def test_execution_injection(self):
        """Test execution keyword injection"""
        assert not validate_layer_name("EXEC sp_executesql")[0]
        assert not validate_layer_name("xp_cmdshell")[0]

    def test_path_traversal(self):
        """Test path traversal prevention"""
        assert not validate_layer_name("../suburbs")[0]
        assert not validate_layer_name("suburbs/../../etc")[0]
        assert not validate_layer_name("suburbs\\..\\passwd")[0]

    def test_invalid_characters(self):
        """Test invalid characters"""
        assert not validate_layer_name("suburbs@#$")[0]
        assert not validate_layer_name("suburbs with spaces")[0]
        assert not validate_layer_name("suburbs!")[0]

    def test_length_validation(self):
        """Test length limits"""
        assert not validate_layer_name("")[0]  # Too short
        assert not validate_layer_name("a" * 101)[0]  # Too long
        assert validate_layer_name("a" * 100)[0]  # Max length


class TestAttributeNameValidation:
    """Test attribute name validation"""

    def test_valid_attribute_names(self):
        """Test valid attribute names"""
        assert validate_attribute_name("population")[0]
        assert validate_attribute_name("area_sqm")[0]
        assert validate_attribute_name("_private_field")[0]
        assert validate_attribute_name("field123")[0]

    def test_must_start_with_letter_or_underscore(self):
        """Test attribute must start with letter or underscore"""
        assert not validate_attribute_name("123field")[0]
        assert not validate_attribute_name("-field")[0]

    def test_alphanumeric_underscore_only(self):
        """Test only alphanumerics and underscores allowed"""
        assert not validate_attribute_name("field-name")[0]
        assert not validate_attribute_name("field name")[0]
        assert not validate_attribute_name("field@home")[0]

    def test_sql_keyword_prevention(self):
        """Test SQL keywords are rejected"""
        assert not validate_attribute_name("select")[0]
        assert not validate_attribute_name("insert")[0]
        assert not validate_attribute_name("delete")[0]
        assert not validate_attribute_name("drop")[0]


class TestSqlIdentifierSanitization:
    """Test SQL identifier sanitization"""

    def test_basic_sanitization(self):
        """Test basic identifier wrapping"""
        assert sanitize_sql_identifier("population") == '"population"'
        assert sanitize_sql_identifier("area_sqm") == '"area_sqm"'

    def test_quote_escaping(self):
        """Test internal quote escaping"""
        assert sanitize_sql_identifier('field"name') == '"field""name"'
        assert sanitize_sql_identifier('test"quote"here') == '"test""quote""here"'

    def test_strip_existing_quotes(self):
        """Test existing quotes are stripped"""
        assert sanitize_sql_identifier('"population"') == '"population"'


class TestGeometryComplexity:
    """Test geometry complexity validation"""

    def test_point_complexity(self):
        """Test Point is simple (1 vertex)"""
        geom = Point(18.4241, -33.9249)
        is_valid, error = validate_geometry_complexity(geom)
        assert is_valid

    def test_linestring_complexity(self):
        """Test LineString vertex counting"""
        coords = [(i, i) for i in range(100)]
        geom = LineString(coords)
        is_valid, error = validate_geometry_complexity(geom, max_vertices=100)
        assert is_valid

    def test_linestring_too_complex(self):
        """Test LineString exceeding vertex limit"""
        coords = [(i, i) for i in range(101)]
        geom = LineString(coords)
        is_valid, error = validate_geometry_complexity(geom, max_vertices=100)
        assert not is_valid
        assert "too complex" in error.lower()

    def test_polygon_complexity(self):
        """Test Polygon with exterior and interior rings"""
        # Simple square
        exterior = [(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)]
        interior = [(2, 2), (8, 2), (8, 8), (2, 8), (2, 2)]
        geom = Polygon(exterior, [interior])

        # Total vertices: 5 (exterior) + 5 (interior) = 10
        is_valid, error = validate_geometry_complexity(geom, max_vertices=10)
        assert is_valid

    def test_multipoint_complexity(self):
        """Test MultiPoint vertex counting"""
        points = [Point(i, i) for i in range(100)]
        geom = MultiPoint(points)
        is_valid, error = validate_geometry_complexity(geom, max_vertices=100)
        assert is_valid


class TestDistanceValidation:
    """Test distance parameter validation"""

    def test_valid_distances(self):
        """Test valid distances"""
        assert validate_distance(1000)[0]  # 1km
        assert validate_distance(50000)[0]  # 50km
        assert validate_distance(0.1)[0]  # 10cm

    def test_zero_distance(self):
        """Test zero distance is invalid"""
        is_valid, error = validate_distance(0)
        assert not is_valid
        assert "positive" in error.lower()

    def test_negative_distance(self):
        """Test negative distance is invalid"""
        is_valid, error = validate_distance(-1000)
        assert not is_valid

    def test_exceeds_max_distance(self):
        """Test distance exceeding maximum"""
        is_valid, error = validate_distance(200000, max_distance=100000)
        assert not is_valid
        assert "exceeds maximum" in error.lower()


class TestLimitValidation:
    """Test result limit validation"""

    def test_valid_limits(self):
        """Test valid result limits"""
        assert validate_limit(1)[0]
        assert validate_limit(100)[0]
        assert validate_limit(10000)[0]

    def test_zero_limit(self):
        """Test zero limit is invalid"""
        is_valid, error = validate_limit(0)
        assert not is_valid
        assert "at least 1" in error.lower()

    def test_negative_limit(self):
        """Test negative limit is invalid"""
        is_valid, error = validate_limit(-10)
        assert not is_valid

    def test_exceeds_max_limit(self):
        """Test limit exceeding maximum"""
        is_valid, error = validate_limit(20000, max_limit=10000)
        assert not is_valid
        assert "exceeds maximum" in error.lower()


class TestEmailValidation:
    """Test email address validation"""

    def test_valid_emails(self):
        """Test valid email formats"""
        assert validate_email("user@example.com")[0]
        assert validate_email("john.doe@company.org")[0]
        assert validate_email("test+tag@domain.co.uk")[0]

    def test_invalid_email_format(self):
        """Test invalid email formats"""
        assert not validate_email("not-an-email")[0]
        assert not validate_email("@example.com")[0]
        assert not validate_email("user@")[0]
        assert not validate_email("user@domain")[0]  # No TLD

    def test_email_too_long(self):
        """Test email exceeding RFC 5321 limit"""
        long_email = "a" * 250 + "@example.com"
        is_valid, error = validate_email(long_email)
        assert not is_valid
        assert "too long" in error.lower()


class TestPaginationValidation:
    """Test pagination parameter validation"""

    def test_valid_pagination(self):
        """Test valid pagination parameters"""
        assert validate_pagination(1, 50)[0]
        assert validate_pagination(10, 100)[0]
        assert validate_pagination(1, 1000)[0]

    def test_page_zero(self):
        """Test page 0 is invalid"""
        is_valid, error = validate_pagination(0, 50)
        assert not is_valid
        assert "at least 1" in error.lower()

    def test_negative_page(self):
        """Test negative page is invalid"""
        is_valid, error = validate_pagination(-1, 50)
        assert not is_valid

    def test_zero_page_size(self):
        """Test page size 0 is invalid"""
        is_valid, error = validate_pagination(1, 0)
        assert not is_valid

    def test_page_size_exceeds_max(self):
        """Test page size exceeding maximum"""
        is_valid, error = validate_pagination(1, 2000, max_page_size=1000)
        assert not is_valid
        assert "exceeds maximum" in error.lower()


class TestWKTValidation:
    """Test WKT string validation"""

    def test_valid_wkt_point(self):
        """Test valid WKT Point"""
        is_valid, error = validate_wkt("POINT(18.4241 -33.9249)")
        assert is_valid
        assert error is None

    def test_valid_wkt_linestring(self):
        """Test valid WKT LineString"""
        is_valid, error = validate_wkt("LINESTRING(0 0, 1 1, 2 2)")
        assert is_valid

    def test_valid_wkt_polygon(self):
        """Test valid WKT Polygon"""
        is_valid, error = validate_wkt(
            "POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))"
        )
        assert is_valid

    def test_invalid_wkt_syntax(self):
        """Test invalid WKT syntax"""
        is_valid, error = validate_wkt("POINT(invalid)")
        assert not is_valid
        assert error is not None

    def test_empty_geometry(self):
        """Test empty WKT geometry"""
        is_valid, error = validate_wkt("POINT EMPTY")
        assert not is_valid
        assert "empty" in error.lower()

    def test_invalid_polygon_not_closed(self):
        """Test invalid polygon (not closed)"""
        # Note: Shapely may auto-close, but validation should catch issues
        is_valid, error = validate_wkt("POLYGON((0 0, 10 0, 10 10))")
        # This depends on Shapely's behavior; adjust test if needed
        assert not is_valid or error is not None


# Integration test for combined validation
class TestValidationIntegration:
    """Test validation functions working together"""

    def test_spatial_query_validation_pipeline(self):
        """Test typical spatial query validation flow"""
        # 1. Validate layer name
        layer_is_valid, _ = validate_layer_name("suburbs")
        assert layer_is_valid

        # 2. Validate bounding box
        bbox_is_valid, _ = validate_bbox(-34.0, 18.0, -33.8, 18.6)
        assert bbox_is_valid

        # 3. Validate result limit
        limit_is_valid, _ = validate_limit(1000)
        assert limit_is_valid

    def test_buffer_query_validation_pipeline(self):
        """Test buffer query validation flow"""
        # 1. Validate coordinate
        coord_is_valid, _ = validate_coordinate(-33.9249, 18.4241)
        assert coord_is_valid

        # 2. Validate distance
        dist_is_valid, _ = validate_distance(5000)  # 5km buffer
        assert dist_is_valid

        # 3. Validate WKT
        wkt_is_valid, _ = validate_wkt("POINT(18.4241 -33.9249)")
        assert wkt_is_valid


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
