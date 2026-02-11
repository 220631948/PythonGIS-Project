"""
PostGIS Database Configuration and Connection Management

Provides async SQLAlchemy engine, session management, and PostGIS utilities
for the Cape Town GeoHub application with robust retry logic.

Gracefully handles missing DATABASE_URL so that import-time crashes are avoided.
When the database is unavailable, endpoints that need it will raise at call time.
"""

import asyncio
import logging
import os
import time
from typing import AsyncGenerator, Optional, Any, Dict

from sqlalchemy import text, create_engine
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from geoalchemy2 import Geometry
    from geoalchemy2.shape import to_shape
except ImportError:
    Geometry = None

    def to_shape(x):  # type: ignore[misc]
        raise ImportError(
            "geoalchemy2 is required for geometry operations. "
            "Please install geoalchemy2."
        )

try:
    from shapely.geometry import mapping
except Exception:  # pragma: no cover - optional system dependency
    def mapping(x):
        raise ImportError(
            "shapely is required for geometry operations. Please install shapely to use mapping functions."
        )

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database URL resolution (no crash on missing env var)
# Normalizes to asyncpg for async engine while keeping a sync URL for GeoPandas
# ---------------------------------------------------------------------------
RAW_DATABASE_URL: Optional[str] = os.environ.get("DATABASE_URL")


def _normalize_database_urls(url: str) -> tuple[str, str]:
    """
    Ensure we always have an asyncpg DSN for async SQLAlchemy while also
    providing a psycopg2-compatible DSN for sync GeoPandas operations.

    Handles common misconfigurations (postgres://, postgresql+psycopg2://)
    to prevent the "async driver required" error seen in devtools.
    """

    normalized = url.strip()

    # Heroku-style URLs
    if normalized.startswith("postgres://"):
        normalized = normalized.replace("postgres://", "postgresql://", 1)

    # If someone supplied the sync driver, transparently upgrade to asyncpg
    if normalized.startswith("postgresql+psycopg2://"):
        logger.warning(
            "DATABASE_URL uses psycopg2; upgrading to asyncpg for async engine compatibility."
        )
        normalized = normalized.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    elif normalized.startswith("postgresql://"):
        # Add explicit async driver for consistency
        logger.info("Normalizing DATABASE_URL to use asyncpg driver for async engine.")
        normalized = normalized.replace("postgresql://", "postgresql+asyncpg://", 1)

    async_url = normalized
    sync_url = normalized.replace("postgresql+asyncpg://", "postgresql://", 1)
    return async_url, sync_url


if RAW_DATABASE_URL:
    DATABASE_URL, SYNC_DATABASE_URL = _normalize_database_urls(RAW_DATABASE_URL)
else:
    DATABASE_URL = None
    SYNC_DATABASE_URL = None
    logger.warning(
        "DATABASE_URL not set — database features disabled. "
        "Set DATABASE_URL to enable PostGIS integration, e.g. "
        "postgresql+asyncpg://geohub:geohub_password@localhost:5432/geohub_db"
    )

# ---------------------------------------------------------------------------
# Sync engine (lazy: only created when DATABASE_URL is available)
# ---------------------------------------------------------------------------
engine: Optional[Any] = None
SessionLocal: Optional[sessionmaker] = None

if SYNC_DATABASE_URL:
    engine = create_engine(
        SYNC_DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        pool_pre_ping=True,
        echo=os.environ.get("DEBUG", "").lower() == "true",
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def require_engine():
    """Return the sync engine or raise a clear error."""
    if engine is None:
        raise DatabaseConnectionError(
            "No database connection — DATABASE_URL environment variable is not set."
        )
    return engine


class DatabaseConnectionError(Exception):
    """Raised when database connection fails after all retries."""

    pass


async def create_engine_with_retry(
    max_retries: int = 4,
    initial_delay: float = 1.0,
    max_delay: float = 8.0,
) -> AsyncEngine:
    """
    Create async SQLAlchemy engine with exponential backoff retry logic.

    Raises:
        DatabaseConnectionError: If DATABASE_URL is missing or connection fails.
    """
    if not DATABASE_URL:
        raise DatabaseConnectionError(
            "DATABASE_URL is not set — cannot create async engine."
        )

    delay = initial_delay
    start_time = time.time()

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(
                f"Database connection attempt {attempt}/{max_retries} "
                f"(elapsed: {time.time() - start_time:.1f}s)"
            )

            engine = create_async_engine(
                DATABASE_URL,
                pool_size=20,
                max_overflow=40,
                pool_recycle=3600,
                pool_pre_ping=True,
                echo=os.environ.get("DEBUG", "").lower() == "true",
            )

            # Test the connection
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))

            logger.info("Database connection established successfully!")
            return engine

        except Exception as e:
            elapsed = time.time() - start_time
            logger.warning(
                f"Database connection failed (attempt {attempt}/{max_retries}, "
                f"elapsed: {elapsed:.1f}s): {e}"
            )

            if attempt < max_retries:
                logger.info(
                    f"Troubleshooting tips:\n"
                    f"  - Check if postgres container is running: docker ps\n"
                    f"  - Check postgres logs: docker logs geohub_postgis\n"
                    f"  - Verify network connectivity: docker network ls\n"
                    f"Retrying in {delay:.1f}s..."
                )
                await asyncio.sleep(delay)
                delay = min(delay * 2, max_delay)
            else:
                raise DatabaseConnectionError(
                    f"Failed to connect to database after {max_retries} attempts "
                    f"({elapsed:.1f}s elapsed).\n"
                    f"Suggestions:\n"
                    f"  1. Ensure postgres container is healthy: docker ps\n"
                    f"  2. Check postgres logs: docker logs geohub_postgis\n"
                    f"  3. Verify DATABASE_URL is correct: {DATABASE_URL}\n"
                    f"  4. Check network connectivity between containers"
                ) from e


# Global engine and session factory (initialized lazily)
_engine: Optional[AsyncEngine] = None
_async_session_factory: Optional[async_sessionmaker[AsyncSession]] = None

# Base class for declarative models
Base = declarative_base()


async def get_engine() -> AsyncEngine:
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        _engine = await create_engine_with_retry()
    return _engine


async def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Get or create the async session factory."""
    global _async_session_factory
    if _async_session_factory is None:
        engine = await get_engine()
        _async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async generator that yields database sessions for FastAPI dependency injection.

    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    session_factory = await get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_database_connections() -> None:
    """
    Gracefully close all database connections.
    Call this during application shutdown.
    """
    global _engine, _async_session_factory

    if _engine is not None:
        logger.info("Closing database connections...")
        await _engine.dispose()
        _engine = None
        _async_session_factory = None
        logger.info("Database connections closed.")


async def check_db_connection() -> Dict[str, Any]:
    """
    Check database connection and return status info.
    """
    status = {
        "connected": False,
        "postgis_enabled": False,
        "postgis_version": None,
        "error": None,
    }

    try:
        engine = await get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1;"))
            status["connected"] = True

            # Check PostGIS
            result = await conn.execute(
                text(
                    "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis');"
                )
            )
            status["postgis_enabled"] = result.scalar()

            if status["postgis_enabled"]:
                version_result = await conn.execute(text("SELECT PostGIS_Version();"))
                status["postgis_version"] = version_result.scalar()

    except Exception as e:
        status["error"] = str(e)
        logger.error(f"Database connection check failed: {e}")

    return status


def geometry_to_geojson(geom) -> Optional[Dict[str, Any]]:
    """Convert a GeoAlchemy2 geometry to GeoJSON dict."""
    if geom is None:
        return None
    try:
        shape = to_shape(geom)
        return mapping(shape)
    except Exception as e:
        logger.warning(f"Could not convert geometry to GeoJSON: {e}")
        return None


def row_to_feature(row: Any, geom_column: str = "geom") -> Dict[str, Any]:
    """Convert a SQLAlchemy row result to a GeoJSON Feature."""
    if hasattr(row, "_mapping"):
        row_dict = dict(row._mapping)
    elif hasattr(row, "__dict__"):
        row_dict = {k: v for k, v in row.__dict__.items() if not k.startswith("_")}
    else:
        row_dict = dict(row)

    geom = row_dict.pop(geom_column, None)
    geometry = geometry_to_geojson(geom) if geom else None

    properties = {}
    for key, value in row_dict.items():
        if key.startswith("_"):
            continue
        if hasattr(value, "isoformat"):
            properties[key] = value.isoformat()
        elif hasattr(value, "item"):
            try:
                properties[key] = value.item()
            except (ValueError, AttributeError):
                properties[key] = str(value)
        elif value is None or isinstance(value, (str, int, float, bool, list, dict)):
            properties[key] = value
        else:
            properties[key] = str(value)

    return {"type": "Feature", "geometry": geometry, "properties": properties}


def rows_to_feature_collection(rows: list, geom_column: str = "geom") -> Dict[str, Any]:
    """Convert a list of SQLAlchemy row results to a GeoJSON FeatureCollection."""
    features = [row_to_feature(row, geom_column) for row in rows]
    return {"type": "FeatureCollection", "features": features}


async def get_clustered_points(
    table_name: str,
    zoom: int,
    bounds: Optional[tuple[float, float, float, float]] = None,
    geom_column: str = "geom",
    max_features: int = 5000,
) -> Dict[str, Any]:
    """
    Get server-side clustered points using PostGIS ST_ClusterKMeans.

    Args:
        table_name: Name of the table to cluster
        zoom: Current zoom level (0-22)
        bounds: Optional bounding box (min_lng, min_lat, max_lng, max_lat)
        geom_column: Name of the geometry column
        max_features: Maximum features to return

    Returns:
        Dict with clustered points as GeoJSON
    """
    import re

    # Validate table_name against SQL injection (only allow alphanumeric + underscores)
    if not re.match(r"^[a-zA-Z_]\w{0,62}$", table_name):
        raise ValueError(f"Invalid table name: {table_name!r}")
    # Validate geom_column similarly
    if not re.match(r"^[a-zA-Z_]\w{0,62}$", geom_column):
        raise ValueError(f"Invalid geometry column: {geom_column!r}")

    try:
        engine = await get_engine()

        # Calculate cluster count based on zoom level
        # Lower zoom = fewer clusters, higher zoom = more detail
        cluster_count = max(5, min(100, int(2 ** (zoom / 2))))

        # Build query with parameterised bounds filter
        # table_name and geom_column are validated above and safe for interpolation;
        # all numeric values are passed as bind parameters.
        bounds_filter = ""
        bind_params: Dict[str, Any] = {
            "cluster_count": cluster_count,
            "max_features": max_features,
        }

        if bounds:
            min_lng, min_lat, max_lng, max_lat = bounds
            bounds_filter = f"""
            WHERE ST_Intersects(
                {geom_column},
                ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326)
            )
            """
            bind_params.update({
                "min_lng": min_lng,
                "min_lat": min_lat,
                "max_lng": max_lng,
                "max_lat": max_lat,
            })

        # Use ST_ClusterKMeans for point clustering
        query = text(f"""
        WITH clustered AS (
            SELECT
                {geom_column},
                ST_ClusterKMeans({geom_column}, :cluster_count) OVER() AS cluster_id
            FROM {table_name}
            {bounds_filter}
            LIMIT :max_features
        )
        SELECT
            cluster_id,
            COUNT(*) as point_count,
            ST_AsGeoJSON(ST_Centroid(ST_Collect({geom_column})))::json as centroid,
            ST_AsGeoJSON(ST_Envelope(ST_Collect({geom_column})))::json as bounds
        FROM clustered
        GROUP BY cluster_id
        ORDER BY cluster_id;
        """)

        async with engine.connect() as conn:
            result = await conn.execute(query, bind_params)
            rows = result.fetchall()

            features = []
            for row in rows:
                cluster_id, point_count, centroid, bounds_geom = row
                features.append({
                    "type": "Feature",
                    "geometry": centroid,
                    "properties": {
                        "cluster_id": cluster_id,
                        "point_count": point_count,
                        "is_cluster": point_count > 1,
                        "bounds": bounds_geom
                    }
                })

            return {
                "type": "FeatureCollection",
                "features": features,
                "metadata": {
                    "cluster_count": len(features),
                    "zoom": zoom,
                    "total_points": sum(f["properties"]["point_count"] for f in features)
                }
            }

    except Exception as e:
        logger.error(f"Clustering error for table {table_name}: {e}")
        raise
