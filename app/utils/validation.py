"""
Input Validation Utilities

Helper functions for validating spatial data, WKT strings, and common patterns.

Sprint 3 - Phase D.2.1
"""

import re
from typing import Optional, Tuple
from shapely import wkt
from shapely.geometry import Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon
from shapely.validation import explain_validity


def validate_wkt(wkt_string: str) -> Tuple[bool, Optional[str]]:
    """
    Validate WKT (Well-Known Text) geometry string.

    Args:
        wkt_string: WKT geometry string

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_wkt("POINT(18.4241 -33.9249)")
        >>> assert is_valid
    """
    try:
        geom = wkt.loads(wkt_string)

        # Check if geometry is valid
        if not geom.is_valid:
            return False, explain_validity(geom)

        # Check if geometry is empty
        if geom.is_empty:
            return False, "Geometry is empty"

        return True, None

    except Exception as e:
        return False, f"Invalid WKT: {str(e)}"


def validate_coordinate(lat: float, lng: float) -> Tuple[bool, Optional[str]]:
    """
    Validate latitude and longitude coordinates.

    Args:
        lat: Latitude (-90 to 90)
        lng: Longitude (-180 to 180)

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_coordinate(-33.9249, 18.4241)
        >>> assert is_valid
    """
    if not (-90 <= lat <= 90):
        return False, f"Latitude {lat} out of range (-90 to 90)"

    if not (-180 <= lng <= 180):
        return False, f"Longitude {lng} out of range (-180 to 180)"

    # Check for null island (0, 0) which is often an error
    if lat == 0 and lng == 0:
        return False, "Coordinates (0, 0) likely invalid (Null Island)"

    return True, None


def validate_bbox(min_lat: float, min_lng: float, max_lat: float, max_lng: float) -> Tuple[bool, Optional[str]]:
    """
    Validate bounding box coordinates.

    Args:
        min_lat: Minimum latitude
        min_lng: Minimum longitude
        max_lat: Maximum latitude
        max_lng: Maximum longitude

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_bbox(-34.0, 18.0, -33.8, 18.6)
        >>> assert is_valid
    """
    # Validate individual coordinates
    for lat, lng in [(min_lat, min_lng), (max_lat, max_lng)]:
        is_valid, error = validate_coordinate(lat, lng)
        if not is_valid:
            return False, error

    # Check min < max
    if max_lat <= min_lat:
        return False, f"max_lat ({max_lat}) must be greater than min_lat ({min_lat})"

    if max_lng <= min_lng:
        return False, f"max_lng ({max_lng}) must be greater than min_lng ({min_lng})"

    # Check for reasonable size (prevent DOS)
    lat_diff = max_lat - min_lat
    lng_diff = max_lng - min_lng

    if lat_diff > 10 or lng_diff > 10:
        return False, f"Bounding box too large ({lat_diff}° × {lng_diff}°). Maximum 10° in each direction."

    return True, None


def validate_layer_name(layer_name: str) -> Tuple[bool, Optional[str]]:
    """
    Validate layer name for SQL injection and path traversal.

    Args:
        layer_name: Layer name to validate

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_layer_name("suburbs")
        >>> assert is_valid
    """
    # Check length
    if len(layer_name) < 1 or len(layer_name) > 100:
        return False, "Layer name must be 1-100 characters"

    # Check for SQL injection patterns
    sql_patterns = [
        r"(;|\-\-|\/\*|\*\/|xp_|sp_)",  # SQL comment/injection
        r"(union|select|insert|update|delete|drop|create|alter)",  # SQL keywords
        r"(exec|execute|script)",  # Execution keywords
    ]

    for pattern in sql_patterns:
        if re.search(pattern, layer_name, re.IGNORECASE):
            return False, f"Layer name contains forbidden pattern: {pattern}"

    # Check for path traversal
    if ".." in layer_name or "/" in layer_name or "\\" in layer_name:
        return False, "Layer name contains path traversal characters"

    # Must be alphanumeric with underscores/hyphens
    if not re.match(r"^[a-zA-Z0-9_\-]+$", layer_name):
        return False, "Layer name must be alphanumeric with underscores or hyphens"

    return True, None


def validate_attribute_name(attr_name: str) -> Tuple[bool, Optional[str]]:
    """
    Validate attribute/column name for SQL injection.

    Args:
        attr_name: Attribute name to validate

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_attribute_name("population")
        >>> assert is_valid
    """
    # Check length
    if len(attr_name) < 1 or len(attr_name) > 100:
        return False, "Attribute name must be 1-100 characters"

    # Must be alphanumeric with underscores
    if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", attr_name):
        return False, "Attribute name must start with letter/underscore and contain only alphanumerics/underscores"

    # Check for SQL keywords
    sql_keywords = ["select", "insert", "update", "delete", "drop", "union", "exec", "script"]
    if attr_name.lower() in sql_keywords:
        return False, f"Attribute name '{attr_name}' is a reserved SQL keyword"

    return True, None


def sanitize_sql_identifier(identifier: str) -> str:
    """
    Sanitize SQL identifier (table/column name) by wrapping in double quotes.

    Args:
        identifier: SQL identifier to sanitize

    Returns:
        Sanitized identifier wrapped in double quotes

    Example:
        >>> sanitize_sql_identifier("population")
        '"population"'
    """
    # Remove existing quotes
    identifier = identifier.strip('"')

    # Escape internal quotes
    identifier = identifier.replace('"', '""')

    # Wrap in double quotes
    return f'"{identifier}"'


def validate_geometry_complexity(geom, max_vertices: int = 10000) -> Tuple[bool, Optional[str]]:
    """
    Validate geometry complexity to prevent DOS attacks.

    Args:
        geom: Shapely geometry object
        max_vertices: Maximum number of vertices allowed

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> from shapely.geometry import Point
        >>> geom = Point(18.4241, -33.9249)
        >>> is_valid, error = validate_geometry_complexity(geom)
        >>> assert is_valid
    """
    try:
        # Count vertices
        if isinstance(geom, Point):
            vertex_count = 1
        elif isinstance(geom, LineString):
            vertex_count = len(geom.coords)
        elif isinstance(geom, Polygon):
            vertex_count = len(geom.exterior.coords)
            for interior in geom.interiors:
                vertex_count += len(interior.coords)
        elif isinstance(geom, (MultiPoint, MultiLineString, MultiPolygon)):
            vertex_count = sum(
                validate_geometry_complexity(sub_geom, max_vertices)[0]
                for sub_geom in geom.geoms
            )
        else:
            return False, f"Unsupported geometry type: {type(geom)}"

        if vertex_count > max_vertices:
            return False, f"Geometry too complex ({vertex_count} vertices). Maximum {max_vertices} allowed."

        return True, None

    except Exception as e:
        return False, f"Error validating geometry: {str(e)}"


def validate_distance(distance: float, max_distance: float = 100000) -> Tuple[bool, Optional[str]]:
    """
    Validate distance parameter for buffer/nearest operations.

    Args:
        distance: Distance in meters
        max_distance: Maximum allowed distance

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_distance(1000)
        >>> assert is_valid
    """
    if distance <= 0:
        return False, "Distance must be positive"

    if distance > max_distance:
        return False, f"Distance {distance}m exceeds maximum {max_distance}m"

    return True, None


def validate_limit(limit: int, max_limit: int = 10000) -> Tuple[bool, Optional[str]]:
    """
    Validate result limit parameter.

    Args:
        limit: Result limit
        max_limit: Maximum allowed limit

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_limit(100)
        >>> assert is_valid
    """
    if limit < 1:
        return False, "Limit must be at least 1"

    if limit > max_limit:
        return False, f"Limit {limit} exceeds maximum {max_limit}"

    return True, None


def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email address format.

    Args:
        email: Email address to validate

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_email("user@example.com")
        >>> assert is_valid
    """
    # Basic email regex (not RFC 5322 compliant but good enough)
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    if not re.match(email_pattern, email):
        return False, "Invalid email format"

    if len(email) > 254:  # RFC 5321
        return False, "Email too long (max 254 characters)"

    return True, None


def validate_pagination(page: int, page_size: int, max_page_size: int = 1000) -> Tuple[bool, Optional[str]]:
    """
    Validate pagination parameters.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        max_page_size: Maximum allowed page size

    Returns:
        Tuple of (is_valid, error_message)

    Example:
        >>> is_valid, error = validate_pagination(1, 50)
        >>> assert is_valid
    """
    if page < 1:
        return False, "Page must be at least 1"

    if page_size < 1:
        return False, "Page size must be at least 1"

    if page_size > max_page_size:
        return False, f"Page size {page_size} exceeds maximum {max_page_size}"

    return True, None
