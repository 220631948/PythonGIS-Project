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
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, Any, Dict

from sqlalchemy import text, event, create_engine
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
    AsyncEngine,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import QueuePool

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

from shapely.geometry import mapping

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database URL resolution (no crash on missing env var)
# ---------------------------------------------------------------------------
DATABASE_URL: Optional[str] = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Create synchronous DATABASE_URL for geopandas and sync operations
    SYNC_DATABASE_URL: Optional[str] = DATABASE_URL.replace(
        "postgresql+asyncpg://", "postgresql://"
    )
else:
    SYNC_DATABASE_URL = None
    logger.warning(
        "DATABASE_URL not set — database features disabled. "
        "Set DATABASE_URL to enable PostGIS integration, e.g. "
        "postgresql+asyncpg://geohub:geohub_password@db:5432/geohub_db"
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
    max_retries: int = 10,
    initial_delay: float = 2.0,
    max_delay: float = 30.0,
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
