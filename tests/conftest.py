"""
Pytest fixtures and test utilities for Cape Town GeoHub.

Provides reusable fixtures for:
- Mock GeoDataFrames with realistic spatial data
- Database session management
- API client setup
- Sample data generation
"""

import pytest
from datetime import datetime, timezone
from typing import Generator, Any
try:
    import geopandas as gpd
except Exception:  # pragma: no cover - optional heavy dependency for some test suites
    gpd = None
try:
    from shapely.geometry import Point, Polygon, LineString
except Exception:  # pragma: no cover - optional heavy dependency for some test suites
    Point = Polygon = LineString = None
try:
    import pandas as pd
except Exception:  # pragma: no cover - optional heavy dependency for some test suites
    pd = None

try:
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
except ImportError:
    AsyncSession = None
    create_async_engine = None
    async_sessionmaker = None

try:
    from httpx import AsyncClient
except ImportError:
    AsyncClient = None

import os

# Import the app for testing
try:
    from app.main import app
    from app.core.database import Base, get_db
except ImportError:
    app = None
    Base = None
    get_db = None


# ============================================================================
# Mock GeoDataFrame Fixtures
# ============================================================================

@pytest.fixture
def mock_point_geodataframe() -> Any:
    """
    Create a mock GeoDataFrame with point geometries representing facilities.
    
    Returns:
        GeoDataFrame with 10 sample facility points in Cape Town area.
    """
    if gpd is None:  # Lazy import to avoid requiring geopandas in lightweight test runs
        import geopandas as gpd

    # Cape Town area coordinates (roughly -33.9 to -34.0, 18.4 to 18.5)
    data = {
        'id': range(1, 11),
        'name': [
            'Hospital A', 'School B', 'Clinic C', 'Library D', 'Park E',
            'Police Station F', 'Fire Station G', 'Community Center H',
            'Sports Ground I', 'Library J'
        ],
        'type': [
            'hospital', 'school', 'clinic', 'library', 'park',
            'police', 'fire', 'community', 'sports', 'library'
        ],
        'capacity': [500, 800, 150, 200, None, 50, 30, 300, 1000, 180],
        'status': ['active'] * 8 + ['inactive', 'active'],
        'created_at': [datetime.now(timezone.utc)] * 10,
        'geometry': [
            Point(18.4241, -33.9249),  # Cape Town City Center
            Point(18.4700, -33.9600),
            Point(18.3800, -33.9100),
            Point(18.4500, -33.9400),
            Point(18.4100, -33.9500),
            Point(18.4600, -33.9300),
            Point(18.4300, -33.9450),
            Point(18.4400, -33.9350),
            Point(18.4200, -33.9550),
            Point(18.4800, -33.9200),
        ]
    }
    
    gdf = gpd.GeoDataFrame(data, crs='EPSG:4326')
    return gdf


@pytest.fixture
def mock_polygon_geodataframe() -> Any:
    """
    Create a mock GeoDataFrame with polygon geometries representing districts.
    
    Returns:
        GeoDataFrame with 5 sample district polygons.
    """
    if gpd is None:  # Lazy import to avoid requiring geopandas in lightweight test runs
        import geopandas as gpd

    data = {
        'id': range(1, 6),
        'district_name': [
            'City Bowl', 'Atlantic Seaboard', 'Southern Suburbs',
            'Northern Suburbs', 'Cape Flats'
        ],
        'population': [180000, 85000, 250000, 320000, 450000],
        'area_sqkm': [8.5, 12.3, 45.2, 78.5, 120.8],
        'median_income': [85000, 150000, 95000, 70000, 45000],
        'geometry': [
            # Simple rectangular polygons for testing
            Polygon([
                (18.42, -33.92), (18.43, -33.92),
                (18.43, -33.93), (18.42, -33.93), (18.42, -33.92)
            ]),
            Polygon([
                (18.38, -33.91), (18.40, -33.91),
                (18.40, -33.93), (18.38, -33.93), (18.38, -33.91)
            ]),
            Polygon([
                (18.44, -33.94), (18.47, -33.94),
                (18.47, -33.97), (18.44, -33.97), (18.44, -33.94)
            ]),
            Polygon([
                (18.45, -33.88), (18.50, -33.88),
                (18.50, -33.91), (18.45, -33.91), (18.45, -33.88)
            ]),
            Polygon([
                (18.50, -33.95), (18.55, -33.95),
                (18.55, -34.00), (18.50, -34.00), (18.50, -33.95)
            ]),
        ]
    }
    
    gdf = gpd.GeoDataFrame(data, crs='EPSG:4326')
    return gdf


@pytest.fixture
def mock_linestring_geodataframe() -> Any:
    """
    Create a mock GeoDataFrame with linestring geometries representing routes.
    
    Returns:
        GeoDataFrame with 3 sample route linestrings.
    """
    if gpd is None:  # Lazy import to avoid requiring geopandas in lightweight test runs
        import geopandas as gpd

    data = {
        'id': range(1, 4),
        'route_name': ['MyCiTi Route 1', 'MyCiTi Route 2', 'Main Road'],
        'transport_type': ['bus', 'bus', 'road'],
        'length_km': [12.5, 8.3, 15.7],
        'avg_passengers_daily': [5000, 3200, None],
        'geometry': [
            LineString([
                (18.42, -33.92), (18.43, -33.93),
                (18.44, -33.94), (18.45, -33.95)
            ]),
            LineString([
                (18.40, -33.91), (18.41, -33.92),
                (18.42, -33.93)
            ]),
            LineString([
                (18.38, -33.90), (18.40, -33.92),
                (18.42, -33.94), (18.44, -33.96)
            ]),
        ]
    }
    
    gdf = gpd.GeoDataFrame(data, crs='EPSG:4326')
    return gdf


@pytest.fixture
def mock_mixed_geometries_geodataframe(
    mock_point_geodataframe,
    mock_polygon_geodataframe
) -> dict:
    """
    Return a dictionary of multiple GeoDataFrames for complex testing.
    
    Returns:
        Dictionary with 'points' and 'polygons' GeoDataFrames.
    """
    return {
        'points': mock_point_geodataframe,
        'polygons': mock_polygon_geodataframe,
    }


# ============================================================================
# Database and API Fixtures
# ============================================================================

@pytest.fixture
def test_database_url() -> str:
    """
    Get test database URL from environment or use default.
    
    Returns:
        Database URL string for testing.
    """
    return os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+asyncpg://geohub:geohub_password@localhost:5432/geohub_test"
    )


@pytest.fixture
async def test_engine(test_database_url):
    """
    Create a test database engine.
    
    Yields:
        AsyncEngine for testing.
    """
    engine = create_async_engine(
        test_database_url,
        echo=False,
        pool_pre_ping=True,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def test_session(test_engine) -> AsyncSession:
    """
    Create a test database session.
    
    Yields:
        AsyncSession for testing.
    """
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(test_session) -> AsyncClient:
    """
    Create an async HTTP client for API testing.
    
    Yields:
        AsyncClient configured with test database session.
    """
    async def override_get_db() -> AsyncSession:
        yield test_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


# ============================================================================
# Spatial Analysis Fixtures
# ============================================================================

@pytest.fixture
def sample_bbox() -> tuple:
    """
    Return a sample bounding box for Cape Town City Bowl area.
    
    Returns:
        Tuple of (minx, miny, maxx, maxy) in EPSG:4326.
    """
    return (18.40, -33.95, 18.45, -33.90)


@pytest.fixture
def sample_point() -> Point:
    """
    Return a sample point in Cape Town city center.
    
    Returns:
        Shapely Point geometry.
    """
    return Point(18.4241, -33.9249)


@pytest.fixture
def sample_polygon() -> Polygon:
    """
    Return a sample polygon covering Cape Town CBD.
    
    Returns:
        Shapely Polygon geometry.
    """
    return Polygon([
        (18.41, -33.92),
        (18.43, -33.92),
        (18.43, -33.93),
        (18.41, -33.93),
        (18.41, -33.92)
    ])


# ============================================================================
# Utility Fixtures
# ============================================================================

@pytest.fixture
def sample_geojson_feature() -> dict:
    """
    Return a sample GeoJSON feature.
    
    Returns:
        Dictionary representing a GeoJSON Feature.
    """
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [18.4241, -33.9249]
        },
        "properties": {
            "name": "Cape Town City Hall",
            "type": "landmark",
            "importance": "high"
        }
    }


@pytest.fixture
def sample_feature_collection(sample_geojson_feature) -> dict:
    """
    Return a sample GeoJSON FeatureCollection.
    
    Returns:
        Dictionary representing a GeoJSON FeatureCollection.
    """
    return {
        "type": "FeatureCollection",
        "features": [
            sample_geojson_feature,
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [18.4700, -33.9600]
                },
                "properties": {
                    "name": "V&A Waterfront",
                    "type": "attraction"
                }
            }
        ]
    }


@pytest.fixture(autouse=True)
def reset_environment():
    """
    Reset environment variables after each test.
    
    Automatically used for all tests.
    """
    original_env = os.environ.copy()
    yield
    os.environ.clear()
    os.environ.update(original_env)
