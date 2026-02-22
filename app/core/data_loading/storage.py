import logging
import re
import geopandas as gpd
from sqlalchemy import text
from app.core.database import require_engine, DatabaseConnectionError

logger = logging.getLogger(__name__)

# Regex for safe SQL identifiers (alphanumeric + underscores, 1-63 chars)
_SAFE_IDENTIFIER_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]{0,62}$")

def _safe_table_name(name: str) -> str:
    """
    Validate and quote a table name to prevent SQL injection.

    Only allows names that match PostgreSQL identifier rules
    (letters, digits, underscores) and wraps in double-quotes.

    Raises:
        ValueError: If the name contains disallowed characters.
    """
    if not _SAFE_IDENTIFIER_RE.match(name):
        raise ValueError(
            f"Invalid table name: {name!r}. "
            "Only letters, digits, and underscores are allowed."
        )
    return f'"{name}"'

class SpatialDataStorage:
    """Manages spatial data storage in PostGIS."""

    def validate_table_name(self, name: str):
        """Validates that the table name is safe for SQL interpolation."""
        _safe_table_name(name)

    def table_exists(self, table_name: str) -> bool:
        """Checks if a table exists in the database."""
        try:
            with require_engine().connect() as conn:
                result = conn.execute(
                    text("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = :table_name AND table_schema = 'public')"),
                    {"table_name": table_name}
                )
                return result.scalar()
        except DatabaseConnectionError:
            return False
        except Exception as e:
            logger.warning(f"Error checking table existence: {e}")
            return False

    def get_record_count(self, dataset_name: str) -> int:
        """Get total count of records in a table."""
        safe_name = _safe_table_name(dataset_name)
        with require_engine().connect() as conn:
            result = conn.execute(
                text(f"SELECT COUNT(*) FROM {safe_name}")  # nosec B608
            )
            return result.scalar() or 0

    def get_paginated_from_postgis(self, dataset_name: str, limit: int, offset: int) -> gpd.GeoDataFrame:
        """Fetch a page of data from PostGIS."""
        safe_name = _safe_table_name(dataset_name)
        # Get page using quoted identifier + bind params
        query = f"SELECT * FROM {safe_name} LIMIT %(limit)s OFFSET %(offset)s"  # nosec B608
        gdf = gpd.read_postgis(
            query,
            require_engine(),
            geom_col="geometry",
            params={"limit": limit, "offset": offset},
        )

        # Convert StringDtype columns to object to avoid serialization errors
        for col in gdf.columns:
            if (
                col != "geometry"
                and hasattr(gdf[col], "dtype")
                and "string" in str(gdf[col].dtype).lower()
            ):
                gdf[col] = gdf[col].astype(object)

        return gdf

    def read_from_postgis(self, dataset_name: str) -> gpd.GeoDataFrame:
        """Read full dataset from PostGIS."""
        safe_name = _safe_table_name(dataset_name)
        logger.info(f"Loading {dataset_name} from PostGIS database.")
        return gpd.read_postgis(
            f"SELECT * FROM {safe_name}", require_engine(), geom_col="geometry"  # nosec B608
        )

    def save_to_postgis(self, gdf: gpd.GeoDataFrame, dataset_name: str, source_url: str = None):
        """Save GeoDataFrame to PostGIS."""
        logger.info(f"Saving {dataset_name} to PostGIS database.")
        # Sanitize column names
        gdf.columns = [
            c.lower().replace(" ", "_").replace("-", "_") for c in gdf.columns
        ]
        gdf.to_postgis(dataset_name, require_engine(), if_exists="replace", index=True)

        # Update metadata
        layer_type = str(gdf.geom_type.mode()[0]) if not gdf.empty and hasattr(gdf, "geometry") else "Unknown"
        self.update_metadata(dataset_name, len(gdf), layer_type, url=source_url)

    def update_metadata(self, name: str, count: int, layer_type: str, url: str = None):
        """Update metadata in spatial_layers table."""
        try:
            with require_engine().connect() as conn:
                # Ensure the metadata table exists
                conn.execute(
                    text("""
                    CREATE TABLE IF NOT EXISTS spatial_layers (
                        id SERIAL PRIMARY KEY,
                        name TEXT UNIQUE,
                        layer_type TEXT,
                        source_url TEXT,
                        record_count INTEGER,
                        last_updated TIMESTAMP
                    )
                    """)
                )

                check = conn.execute(
                    text("SELECT id FROM spatial_layers WHERE name = :name"),
                    {"name": name},
                )

                if check.rowcount == 0:
                    conn.execute(
                        text("""
                        INSERT INTO spatial_layers (name, layer_type, source_url, record_count, last_updated)
                        VALUES (:name, :type, :url, :count, NOW())
                    """),
                        {
                            "name": name,
                            "type": layer_type,
                            "url": url,
                            "count": count,
                        },
                    )
                else:
                    # Only update URL if provided, otherwise keep existing?
                    # The original code always had access to URL from self.data_urls.
                    # Here we might pass None if we don't know it, but for save_to_postgis we should know it.
                    if url:
                         conn.execute(
                            text("""
                            UPDATE spatial_layers SET record_count = :count, last_updated = NOW(), source_url = :url
                            WHERE name = :name
                        """),
                            {"name": name, "count": count, "url": url},
                        )
                    else:
                        conn.execute(
                            text("""
                            UPDATE spatial_layers SET record_count = :count, last_updated = NOW()
                            WHERE name = :name
                        """),
                            {"name": name, "count": count},
                        )
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to update metadata for {name}: {e}")
