"""
PostGIS Database Configuration and Connection Management

Provides SQLAlchemy engine, session management, and PostGIS utilities
for the Cape Town GeoHub application.
"""

from contextlib import contextmanager
from typing import Generator, Optional, Any, Dict
import logging
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import QueuePool
from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
import json

from app.config import settings

logger = logging.getLogger(__name__)

# Create SQLAlchemy engine with connection pool
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,  # Enable connection health checks
    echo=settings.DEBUG,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    Ensures proper cleanup after request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager for database sessions.
    Use this for non-FastAPI contexts (scripts, background tasks).
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> bool:
    """
    Initialize the database with required extensions.
    Returns True if successful.
    """
    try:
        with engine.connect() as conn:
            # Enable PostGIS extension
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_topology;"))
            conn.commit()
            logger.info("PostGIS extensions enabled successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False


def check_postgis_version() -> Optional[str]:
    """
    Check and return the PostGIS version.
    Returns None if PostGIS is not available.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT PostGIS_Version();"))
            version = result.scalar()
            logger.info(f"PostGIS version: {version}")
            return version
    except Exception as e:
        logger.warning(f"Could not get PostGIS version: {e}")
        return None


def check_db_connection() -> Dict[str, Any]:
    """
    Check database connection and return status info.
    """
    status = {
        "connected": False,
        "postgis_enabled": False,
        "postgis_version": None,
        "error": None
    }

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
            status["connected"] = True

            # Check PostGIS
            result = conn.execute(text(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis');"
            ))
            status["postgis_enabled"] = result.scalar()

            if status["postgis_enabled"]:
                version_result = conn.execute(text("SELECT PostGIS_Version();"))
                status["postgis_version"] = version_result.scalar()

    except Exception as e:
        status["error"] = str(e)
        logger.error(f"Database connection check failed: {e}")

    return status


def geometry_to_geojson(geom) -> Optional[Dict[str, Any]]:
    """
    Convert a GeoAlchemy2 geometry to GeoJSON dict.
    """
    if geom is None:
        return None
    try:
        shape = to_shape(geom)
        return mapping(shape)
    except Exception as e:
        logger.warning(f"Could not convert geometry to GeoJSON: {e}")
        return None


def row_to_feature(row: Any, geom_column: str = "geom") -> Dict[str, Any]:
    """
    Convert a SQLAlchemy row result to a GeoJSON Feature.
    """
    # Get row as dict
    if hasattr(row, "_mapping"):
        row_dict = dict(row._mapping)
    elif hasattr(row, "__dict__"):
        row_dict = {k: v for k, v in row.__dict__.items() if not k.startswith("_")}
    else:
        row_dict = dict(row)

    # Extract geometry
    geom = row_dict.pop(geom_column, None)
    geometry = geometry_to_geojson(geom) if geom else None

    # Clean up properties (remove SQLAlchemy internals and convert types)
    properties = {}
    for key, value in row_dict.items():
        if key.startswith("_"):
            continue
        # Handle various types
        if hasattr(value, "isoformat"):  # datetime
            properties[key] = value.isoformat()
        elif hasattr(value, "item"):  # numpy types
            try:
                properties[key] = value.item()
            except (ValueError, AttributeError):
                properties[key] = str(value)
        elif value is None or isinstance(value, (str, int, float, bool, list, dict)):
            properties[key] = value
        else:
            properties[key] = str(value)

    return {
        "type": "Feature",
        "geometry": geometry,
        "properties": properties
    }


def rows_to_feature_collection(rows: list, geom_column: str = "geom") -> Dict[str, Any]:
    """
    Convert a list of SQLAlchemy row results to a GeoJSON FeatureCollection.
    """
    features = [row_to_feature(row, geom_column) for row in rows]
    return {
        "type": "FeatureCollection",
        "features": features
    }


# Event listeners for connection debugging
@event.listens_for(engine, "connect")
def connect(dbapi_connection, connection_record):
    logger.debug("Database connection established")


@event.listens_for(engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    logger.debug("Connection checked out from pool")
