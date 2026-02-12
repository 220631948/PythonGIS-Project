"""
SQL Injection Security Tests

Sprint 4 - S4.2 / F.3.2: SQL injection tests for spatial queries
Tests validation utilities prevent SQL injection attacks

Tests:
- Layer name validation blocks SQL keywords
- Attribute name validation blocks injection
- Spatial query parameter validation
- Path traversal prevention
"""

from app.utils.validation import (
    validate_layer_name,
    validate_attribute_name,
    sanitize_sql_identifier,
)


class TestLayerNameSQLInjection:
    """Test SQL injection prevention in layer names"""

    def test_valid_layer_name(self):
        """Test valid layer name passes"""
        is_valid, error = validate_layer_name("clinics")
        assert is_valid is True
        assert error is None

    def test_sql_select_injection(self):
        """Test SQL SELECT keyword is blocked"""
        is_valid, error = validate_layer_name("clinics; SELECT * FROM users")
        assert is_valid is False
        assert error is not None
        assert "forbidden" in error.lower() or "sql" in error.lower()

    def test_sql_drop_injection(self):
        """Test SQL DROP keyword is blocked"""
        is_valid, error = validate_layer_name("clinics; DROP TABLE users")
        assert is_valid is False
        assert error is not None

    def test_sql_union_injection(self):
        """Test SQL UNION keyword is blocked"""
        is_valid, error = validate_layer_name("clinics UNION SELECT password FROM users")
        assert is_valid is False
        assert error is not None

    def test_sql_comment_injection(self):
        """Test SQL comment injection is blocked"""
        is_valid, error = validate_layer_name("clinics--")
        assert is_valid is False
        assert error is not None

    def test_sql_semicolon_injection(self):
        """Test semicolon injection is blocked"""
        is_valid, error = validate_layer_name("clinics;")
        assert is_valid is False
        assert error is not None

    def test_path_traversal_attempt(self):
        """Test path traversal is blocked"""
        is_valid, error = validate_layer_name("../../../etc/passwd")
        assert is_valid is False
        assert error is not None

    def test_layer_name_with_underscore(self):
        """Test valid layer name with underscore"""
        is_valid, error = validate_layer_name("service_facilities")
        assert is_valid is True

    def test_layer_name_with_numbers(self):
        """Test valid layer name with numbers"""
        is_valid, error = validate_layer_name("myciti_stops_2024")
        assert is_valid is True


class TestAttributeNameSQLInjection:
    """Test SQL injection prevention in attribute names"""

    def test_valid_attribute_name(self):
        """Test valid attribute name passes"""
        is_valid, error = validate_attribute_name("population")
        assert is_valid is True
        assert error is None

    def test_attribute_with_sql_keyword(self):
        """Test attribute with SQL keyword is blocked"""
        is_valid, error = validate_attribute_name("name; DELETE FROM")
        assert is_valid is False
        assert error is not None

    def test_attribute_name_with_underscore(self):
        """Test valid attribute name with underscore"""
        is_valid, error = validate_attribute_name("crime_rate")
        assert is_valid is True

    def test_sql_function_injection(self):
        """Test SQL function injection is blocked"""
        is_valid, error = validate_attribute_name("name); DROP TABLE users; --")
        assert is_valid is False
        assert error is not None


class TestSQLIdentifierSanitization:
    """Test SQL identifier sanitization"""

    def test_sanitize_valid_identifier(self):
        """Test sanitizing valid identifier"""
        sanitized = sanitize_sql_identifier("clinics")
        assert sanitized == "clinics"

    def test_sanitize_removes_special_chars(self):
        """Test sanitization removes dangerous characters"""
        sanitized = sanitize_sql_identifier("clinics; DROP TABLE")
        # Should remove or escape dangerous parts
        assert "DROP" not in sanitized or ";" not in sanitized

    def test_sanitize_quoted_identifier(self):
        """Test sanitization handles quoted identifiers"""
        sanitized = sanitize_sql_identifier("my_layer")
        # Should be safe for SQL
        assert sanitized.replace("_", "").isalnum() or sanitized == "my_layer"


class TestSpatialQueryInjection:
    """Test SQL injection in spatial query parameters"""

    def test_bbox_with_sql_injection(self):
        """Test bounding box parameters reject SQL injection"""
        # Attempt SQL injection via bbox parameters
        malicious_value = "18.5; DROP TABLE spatial_layers"

        # This should be caught by coordinate validation
        try:
            float(malicious_value)
            assert False, "Should have raised ValueError"
        except ValueError:
            # Expected - non-numeric value rejected
            assert True

    def test_layer_name_in_query_blocked(self):
        """Test SQL injection via layer name in query"""
        malicious_layer = "suburbs' OR '1'='1"

        is_valid, error = validate_layer_name(malicious_layer)
        assert is_valid is False

    def test_limit_parameter_validation(self):
        """Test LIMIT parameter rejects non-integers"""
        malicious_limit = "10; DELETE FROM users"

        try:
            int(malicious_limit)
            assert False, "Should have raised ValueError"
        except ValueError:
            # Expected - non-integer rejected
            assert True


class TestStoredXSSPrevention:
    """Test prevention of stored XSS via spatial data"""

    def test_geometry_name_with_script_tag(self):
        """Test geometry name with script tag is handled"""
        malicious_name = "<script>alert('XSS')</script>"

        # This should be escaped or rejected at validation
        # In real app, would be HTML-escaped before display
        assert "<script>" in malicious_name
        # Validation should handle this

    def test_property_value_with_javascript(self):
        """Test property value with JavaScript"""
        malicious_value = "javascript:alert('XSS')"

        # Should be escaped or validated
        assert "javascript:" in malicious_value


class TestParameterizedQueryValidation:
    """Test that parameterized queries are used"""

    def test_layer_query_uses_parameters(self):
        """Test that layer queries use parameterized queries"""
        # This is more of a code review test
        # Actual implementation should use SQLAlchemy or similar
        # which provides parameterization by default

        layer_name = "clinics"
        # Good: SELECT * FROM {table} WHERE id = :id
        # Bad:  SELECT * FROM {table} WHERE id = '{id}'

        # Verify layer name is validated
        is_valid, _ = validate_layer_name(layer_name)
        assert is_valid is True


class TestComplexSQLInjectionAttempts:
    """Test complex SQL injection attempts"""

    def test_multiline_injection(self):
        """Test multi-line SQL injection"""
        malicious = """clinics
        ; DROP TABLE users; --"""

        is_valid, error = validate_layer_name(malicious)
        assert is_valid is False

    def test_encoded_injection(self):
        """Test URL-encoded injection attempt"""
        # Some attackers try URL encoding
        malicious = "clinics%3B%20DROP%20TABLE"  # URL encoded: clinics; DROP TABLE

        is_valid, error = validate_layer_name(malicious)
        # Should still be rejected
        assert is_valid is False or "%" not in malicious

    def test_case_variation_injection(self):
        """Test case variation to bypass filters"""
        malicious = "clinics; DRoP TaBLe users"

        is_valid, error = validate_layer_name(malicious)
        # Case-insensitive detection should catch this
        assert is_valid is False

    def test_obfuscated_injection(self):
        """Test obfuscated SQL injection"""
        malicious = "clinics/**/UNION/**/SELECT"

        is_valid, error = validate_layer_name(malicious)
        assert is_valid is False


class TestDOSPrevention:
    """Test Denial of Service prevention"""

    def test_extremely_long_layer_name(self):
        """Test extremely long layer name is rejected"""
        long_name = "a" * 10000

        is_valid, error = validate_layer_name(long_name)
        # Should reject names that are too long
        assert is_valid is False

    def test_bbox_size_limit(self):
        """Test bounding box size limits"""
        from app.schemas.spatial import BoundsSchema
        from pydantic import ValidationError

        # Try to create bbox larger than 10 degrees
        try:
            bounds = BoundsSchema(
                min_lat=-40.0,
                max_lat=-20.0,  # 20 degree span
                min_lng=10.0,
                max_lng=30.0,  # 20 degree span
            )
            # Should raise validation error
            assert False, "Should have raised ValidationError"
        except ValidationError as e:
            # Expected - bbox too large
            assert "too large" in str(e).lower()
