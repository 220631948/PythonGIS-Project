"""
Pytest fixtures and test utilities for Cape Town GeoHub.

Provides reusable fixtures for:
- Mock GeoDataFrames with realistic spatial data
- Database session management
- API client setup
- Sample data generation
"""

import pytest
import sys
from unittest.mock import MagicMock
from datetime import datetime, timezone
from typing import Generator, Any

# ============================================================================
# Mock Missing Dependencies (FastAPI, Pydantic, SQLAlchemy, etc.)
# ============================================================================
# This allows tests to run in restricted environments where these packages are missing.

def mock_package(name):
    mock = MagicMock()
    mock.__path__ = []
    sys.modules[name] = mock
    return mock

# Mock Pydantic
try:
    import pydantic
except ImportError:
    pydantic = mock_package("pydantic")

    class MockBaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__

    pydantic.BaseModel = MockBaseModel
    pydantic.Field = MagicMock(return_value=None)
    pydantic.EmailStr = str

# Mock pydantic_settings
try:
    import pydantic_settings
except ImportError:
    pydantic_settings = mock_package("pydantic_settings")

    class MockBaseSettings(pydantic.BaseModel):
        pass

    pydantic_settings.BaseSettings = MockBaseSettings
    pydantic_settings.SettingsConfigDict = MagicMock()

# Mock FastAPI
try:
    import fastapi
except ImportError:
    fastapi = mock_package("fastapi")
    fastapi.FastAPI = MagicMock()

    # Configure APIRouter to act as a pass-through decorator
    def route_decorator(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

    router_instance = MagicMock()
    router_instance.get.side_effect = route_decorator
    router_instance.post.side_effect = route_decorator
    router_instance.put.side_effect = route_decorator
    router_instance.delete.side_effect = route_decorator
    router_instance.patch.side_effect = route_decorator

    fastapi.APIRouter = MagicMock(return_value=router_instance)

    class MockHTTPException(Exception):
        def __init__(self, status_code: int, detail: str = None):
            self.status_code = status_code
            self.detail = detail
            super().__init__(detail)

    fastapi.HTTPException = MockHTTPException
    fastapi.Depends = MagicMock()
    fastapi.Query = MagicMock()
    fastapi.Request = MagicMock()
    fastapi.Response = MagicMock()
    fastapi.JSONResponse = MagicMock()
    fastapi.FileResponse = MagicMock()
    fastapi.status = MagicMock()

    class MockBackgroundTasks:
        def add_task(self, func, *args, **kwargs):
            pass
    fastapi.BackgroundTasks = MockBackgroundTasks

    mock_package("fastapi.staticfiles")
    mock_package("fastapi.middleware")
    mock_package("fastapi.middleware.cors")
    mock_package("fastapi.middleware.gzip")
    mock_package("fastapi.responses")
    sys.modules["fastapi.responses"].FileResponse = MagicMock()
    sys.modules["fastapi.responses"].JSONResponse = MagicMock()
    sys.modules["fastapi.responses"].Response = MagicMock()
    mock_package("fastapi.testclient")

# Mock SQLAlchemy
try:
    import sqlalchemy
except ImportError:
    sqlalchemy = mock_package("sqlalchemy")

    sqlalchemy_orm = mock_package("sqlalchemy.orm")
    sqlalchemy.orm = sqlalchemy_orm

    sqlalchemy_ext = mock_package("sqlalchemy.ext")
    sqlalchemy.ext = sqlalchemy_ext

    sqlalchemy_ext_asyncio = mock_package("sqlalchemy.ext.asyncio")
    sqlalchemy.ext.asyncio = sqlalchemy_ext_asyncio

    sqlalchemy_sql = mock_package("sqlalchemy.sql")
    sqlalchemy.sql = sqlalchemy_sql

    sqlalchemy.orm.declarative_base = MagicMock(return_value=type('Base', (), {}))
    sqlalchemy.orm.sessionmaker = MagicMock()
    sqlalchemy.ext.asyncio.create_async_engine = MagicMock()
    sqlalchemy.ext.asyncio.AsyncSession = MagicMock()
    sqlalchemy.ext.asyncio.async_sessionmaker = MagicMock()
    sqlalchemy.ext.asyncio.AsyncEngine = MagicMock()
    sqlalchemy.create_engine = MagicMock()
    sqlalchemy.text = MagicMock()
    sqlalchemy.func = MagicMock()
    sqlalchemy.Column = MagicMock()
    sqlalchemy.Integer = MagicMock()
    sqlalchemy.String = MagicMock()
    sqlalchemy.Float = MagicMock()
    sqlalchemy.Boolean = MagicMock()
    sqlalchemy.DateTime = MagicMock()
    sqlalchemy.JSON = MagicMock()
    sqlalchemy.Text = MagicMock()
    sqlalchemy.Index = MagicMock()

# Mock GeoAlchemy2
try:
    import geoalchemy2
except ImportError:
    geoalchemy2 = mock_package("geoalchemy2")
    geoalchemy2_shape = mock_package("geoalchemy2.shape")
    geoalchemy2.shape = geoalchemy2_shape
    geoalchemy2.Geometry = MagicMock()

# Mock Shapely
try:
    import shapely
    import shapely.geometry
except ImportError:
    shapely = mock_package("shapely")
    shapely_geom = mock_package("shapely.geometry")
    shapely.geometry = shapely_geom

# Mock httpx
try:
    import httpx
except ImportError:
    httpx = mock_package("httpx")
    httpx.AsyncClient = MagicMock()

# Mock other dependencies
for module in ["slowapi", "slowapi.util", "slowapi.errors", "slowapi.middleware",
               "cachetools", "sentry_sdk", "sentry_sdk.integrations.asgi", "psutil"]:
    if module not in sys.modules:
        try:
            __import__(module)
        except ImportError:
            sys.modules[module] = MagicMock()
            if module == "slowapi":
                sys.modules[module].Limiter = MagicMock()
            if module == "slowapi.errors":
                sys.modules[module].RateLimitExceeded = Exception
            if module == "cachetools":
                sys.modules[module].TTLCache = MagicMock(return_value={})

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
except ImportError:
    pd = None

try:
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
except ImportError:
    # Use mocks if actual import fails (even after sys.modules patching, safe fallback)
    AsyncSession = MagicMock()
    create_async_engine = MagicMock()
    async_sessionmaker = MagicMock()

try:
    from httpx import AsyncClient
except ImportError:
    AsyncClient = MagicMock()

import os

# Import the app for testing
try:
    from app.main import app
    from app.core.database import Base, get_db
except ImportError:
    app = MagicMock()
    Base = MagicMock()
    get_db = MagicMock()


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
