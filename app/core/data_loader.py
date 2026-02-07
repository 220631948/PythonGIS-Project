import json
import logging
import re
import pandas as pd
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import requests
import geopandas as gpd
from sqlalchemy import inspect, text
from app.config import settings
from app.core.cache_manager import cache_manager
from app.core.exceptions import DataNotFoundError, DataValidationError
from app.core.database import require_engine

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


class DataValidationResult:
    """Result of data validation checks."""

    def __init__(self):
        self.is_valid = True
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.stats: Dict[str, Any] = {}

    def add_error(self, message: str):
        self.is_valid = False
        self.errors.append(message)

    def add_warning(self, message: str):
        self.warnings.append(message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "stats": self.stats,
        }


class DataLoader:
    def __init__(self):
        self.data_urls = settings.DATA_URLS
        self._retrieval_log: List[Dict[str, Any]] = []

    def get_paginated_gdf(
        self,
        dataset_name: str,
        limit: int = 1000,
        offset: int = 0,
        force_refresh: bool = False,
    ) -> Tuple[gpd.GeoDataFrame, int]:
        """Returns a paginated GeoDataFrame and total count."""

        if dataset_name not in self.data_urls:
            self._log_retrieval(dataset_name, False, "Dataset not configured")
            raise DataNotFoundError(
                f"Dataset '{dataset_name}' not configured in DATA_URLS."
            )

        # Validate table name early to prevent injection in downstream SQL
        _safe_table_name(dataset_name)

        # 1. Try PostGIS (Optimized path)
        if not force_refresh and self._table_exists(dataset_name):
            try:
                safe_name = _safe_table_name(dataset_name)

                # Get total count using quoted identifier
                with require_engine().connect() as conn:
                    result = conn.execute(
                        text(f"SELECT COUNT(*) FROM {safe_name}")  # nosec B608 — safe_name validated by _safe_table_name()
                    )
                    total_count = result.scalar() or 0

                # Get page using quoted identifier + bind params
                # Note: gpd.read_postgis requires str, not TextClause;
                # safety is ensured by _safe_table_name() validation + quoting.
                query = f"SELECT * FROM {safe_name} LIMIT %(limit)s OFFSET %(offset)s"  # nosec B608
                gdf = gpd.read_postgis(
                    query,
                    require_engine(),
                    geom_col="geometry",
                    params={"limit": limit, "offset": offset},
                )

                self._log_retrieval(
                    dataset_name,
                    True,
                    f"Loaded page {offset}-{offset+limit} from PostGIS",
                )
                return gdf, total_count
            except Exception as e:
                logger.warning(
                    f"Failed to load paginated {dataset_name} from PostGIS: {e}"
                )

        # 2. Fallback to full load (via existing get_gdf)
        full_gdf = self.get_gdf(dataset_name, force_refresh=force_refresh)
        total_count = len(full_gdf)

        paginated_gdf = full_gdf.iloc[offset : offset + limit]

        return paginated_gdf, total_count

    def get_gdf(
        self, dataset_name: str, force_refresh: bool = False
    ) -> gpd.GeoDataFrame:
        """Returns a GeoDataFrame for the given dataset, downloading if necessary."""
        if dataset_name not in self.data_urls:
            self._log_retrieval(dataset_name, False, "Dataset not configured")
            raise DataNotFoundError(
                f"Dataset '{dataset_name}' not configured in DATA_URLS."
            )

        # Validate table name early to prevent injection in downstream SQL
        _safe_table_name(dataset_name)

        # Try to load from PostGIS database first
        if not force_refresh:
            try:
                if self._table_exists(dataset_name):
                    safe_name = _safe_table_name(dataset_name)
                    logger.info(f"Loading {dataset_name} from PostGIS database.")
                    # gpd.read_postgis requires str; safety ensured by
                    # _safe_table_name() validation + double-quoting.
                    gdf = gpd.read_postgis(
                        f"SELECT * FROM {safe_name}", require_engine(), geom_col="geometry"  # nosec B608
                    )
                    self._log_retrieval(dataset_name, True, "Loaded from PostGIS")
                    return gdf
            except Exception as e:
                logger.warning(f"Failed to load {dataset_name} from PostGIS: {e}")

        # Fallback to cache/download
        processed_path = cache_manager.get_processed_path(dataset_name)

        if (
            not force_refresh
            and cache_manager.is_cache_valid(dataset_name)
            and processed_path.exists()
        ):
            try:
                logger.info(f"Loading {dataset_name} from cache.")
                gdf = gpd.read_file(processed_path)
                self._log_retrieval(dataset_name, True, "Loaded from cache")
                return gdf
            except Exception as e:
                logger.warning(
                    f"Failed to load cached {dataset_name}: {e}. Redownloading..."
                )

        # Download and process from live open data source
        gdf = self._download_and_process(dataset_name)

        # Validate the data
        validation = self.validate_gdf(gdf, dataset_name)
        if not validation.is_valid:
            logger.error(
                f"Data validation failed for {dataset_name}: {validation.errors}"
            )
            self._log_retrieval(
                dataset_name, False, f"Validation failed: {validation.errors}"
            )
            raise DataValidationError(
                f"Data validation failed for {dataset_name}: {validation.errors}"
            )

        if validation.warnings:
            logger.warning(
                f"Data validation warnings for {dataset_name}: {validation.warnings}"
            )

        # Save to PostGIS for future use
        try:
            logger.info(f"Saving {dataset_name} to PostGIS database.")
            gdf.columns = [
                c.lower().replace(" ", "_").replace("-", "_") for c in gdf.columns
            ]
            gdf.to_postgis(dataset_name, require_engine(), if_exists="replace", index=True)
            self._update_metadata(dataset_name, len(gdf), str(gdf.geom_type.mode()[0]))
        except Exception as e:
            logger.error(f"Failed to save {dataset_name} to PostGIS: {e}")

        # Return the GeoDataFrame so callers can use the loaded data
        return gdf

    def load_csv(self, dataset_name: str) -> pd.DataFrame:
        """Load tabular data (CSV/Excel) from configured source."""
        if dataset_name not in self.data_urls:
            raise DataNotFoundError(
                f"Dataset '{dataset_name}' not configured in DATA_URLS."
            )

        url = self.data_urls[dataset_name]
        logger.info(f"Loading CSV data for {dataset_name} from {url}")

        try:
            # Check cache first ( CSV implementation would ideally share cache logic)
            # For simplicity in this phase, we fetch directly or use a simple file cache
            # In production, use cache_manager similar to get_gdf

            df = pd.read_csv(url)
            self._log_retrieval(dataset_name, True, f"Loaded {len(df)} rows from CSV")
            return df

        except Exception as e:
            self._log_retrieval(dataset_name, False, f"CSV load failed: {e}")
            logger.error(f"Failed to load CSV {dataset_name}: {e}")
            raise DataNotFoundError(f"Failed to load CSV {dataset_name}: {e}")

    def validate_gdf(
        self, gdf: gpd.GeoDataFrame, dataset_name: str
    ) -> DataValidationResult:
        """Validate a GeoDataFrame for data quality."""
        result = DataValidationResult()

        # Check if empty
        if gdf.empty:
            result.add_error(
                "Dataset is empty - no features returned from open data source"
            )
            return result

        # Check geometry validity
        invalid_geoms = (~gdf.geometry.is_valid).sum()
        if invalid_geoms > 0:
            result.add_warning(
                f"{invalid_geoms} invalid geometries detected (will be auto-fixed)"
            )

        # Check for empty geometries
        empty_geoms = gdf.geometry.is_empty.sum()
        if empty_geoms > 0:
            result.add_warning(f"{empty_geoms} empty geometries detected")

        # Check CRS
        if gdf.crs is None:
            result.add_error("No coordinate reference system (CRS) defined")

        # Check for null geometries
        null_geoms = gdf.geometry.isnull().sum()
        if null_geoms > 0:
            result.add_warning(f"{null_geoms} null geometries detected")

        # Statistics
        result.stats = {
            "feature_count": len(gdf),
            "geometry_type": str(gdf.geom_type.mode()[0]) if not gdf.empty else None,
            "crs": str(gdf.crs) if gdf.crs else None,
            "bounds": list(gdf.total_bounds) if not gdf.empty else None,
            "columns": list(gdf.columns),
            "validated_at": datetime.utcnow().isoformat(),
        }

        return result

    def _log_retrieval(self, dataset_name: str, success: bool, message: str):
        """Log data retrieval attempts for monitoring."""
        log_entry = {
            "dataset": dataset_name,
            "success": success,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self._retrieval_log.append(log_entry)
        # Keep only last 100 entries
        if len(self._retrieval_log) > 100:
            self._retrieval_log = self._retrieval_log[-100:]

        if not success:
            logger.error(f"Data retrieval failed for {dataset_name}: {message}")

    def get_retrieval_log(self) -> List[Dict[str, Any]]:
        """Get the data retrieval log for monitoring."""
        return self._retrieval_log.copy()

    def _table_exists(self, table_name: str) -> bool:
        insp = inspect(require_engine())
        return table_name in insp.get_table_names()

    def _update_metadata(self, name: str, count: int, layer_type: str):
        try:
            with require_engine().connect() as conn:
                # Ensure the metadata table exists (helps first-run and test environments)
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
                            "url": self.data_urls.get(name),
                            "count": count,
                        },
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

    def _download_and_process(self, dataset_name: str) -> gpd.GeoDataFrame:
        """Download data from live open data source. Handles ZIP, Shapefile, and GeoJSON."""
        url = self.data_urls[dataset_name]
        logger.info(f"Downloading {dataset_name} from open data source: {url}")

        try:
            response = requests.get(url, timeout=60, stream=True)
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")

            # Handle ZIP files (common for shapefiles)
            if "zip" in content_type or url.endswith(".zip"):
                logger.info(f"Detected ZIP archive for {dataset_name}")
                return self._handle_zip_download(response, dataset_name, url)

            # Handle GeoJSON
            data = response.json()

        except requests.exceptions.Timeout as e:
            self._log_retrieval(dataset_name, False, f"Request timeout: {e}")
            raise DataNotFoundError(
                f"Timeout downloading {dataset_name} from {url}. The open data service may be unavailable."
            )
        except requests.exceptions.HTTPError as e:
            self._log_retrieval(dataset_name, False, f"HTTP error: {e}")
            raise DataNotFoundError(
                f"HTTP error downloading {dataset_name}: {e}. Check if the open data endpoint is accessible."
            )
        except requests.exceptions.RequestException as e:
            self._log_retrieval(dataset_name, False, f"Request failed: {e}")
            # Try local raw file as fallback (previously downloaded real data)
            raw_path = settings.RAW_DATA_DIR / f"{dataset_name}.geojson"
            if raw_path.exists():
                logger.info(f"Using previously downloaded data for {dataset_name}")
                gdf = gpd.read_file(raw_path)
                self._log_retrieval(
                    dataset_name, True, "Loaded from local cache (network unavailable)"
                )
                return self._process_gdf(gdf, dataset_name, url)
            else:
                raise DataNotFoundError(
                    f"Failed to download {dataset_name} from {url} and no cached data available. "
                    f"Error: {e}. Please check network connectivity and the open data source URL."
                )
        except json.JSONDecodeError as e:
            self._log_retrieval(dataset_name, False, f"Invalid JSON response: {e}")
            raise DataNotFoundError(
                f"Invalid JSON response from {url}. The open data format may have changed."
            )

        # Save raw data
        raw_path = settings.RAW_DATA_DIR / f"{dataset_name}.geojson"
        with open(raw_path, "w") as f:
            json.dump(data, f)

        # Try standard geopandas read first, but fall back to a direct
        # GeoJSON parser to avoid issues with Fiona in some container
        # environments (e.g. "module 'fiona' has no attribute 'path'").
        try:
            gdf = gpd.read_file(raw_path)
            self._log_retrieval(
                dataset_name, True, f"Downloaded {len(gdf)} features from open data source (via geopandas)"
            )
        except Exception as e:
            logger.warning(
                f"gpd.read_file failed for {dataset_name}: {e}. Attempting GeoJSON fallback parser."
            )
            try:
                from shapely.geometry import shape

                features = data.get("features", []) if isinstance(data, dict) else []
                rows = []
                for feat in features:
                    geom = None
                    if feat.get("geometry"):
                        try:
                            geom = shape(feat["geometry"])
                        except Exception:
                            geom = None
                    props = feat.get("properties", {}) if isinstance(feat.get("properties"), dict) else {}
                    props["geometry"] = geom
                    rows.append(props)

                gdf = gpd.GeoDataFrame(rows, crs="EPSG:4326")
                self._log_retrieval(
                    dataset_name,
                    True,
                    f"Downloaded {len(gdf)} features from open data source (via fallback parser)",
                )
            except Exception as e2:
                self._log_retrieval(dataset_name, False, f"GeoJSON fallback parse failed: {e2}")
                raise DataNotFoundError(
                    f"Failed to parse GeoJSON for {dataset_name}: {e2}"
                )

        return self._process_gdf(gdf, dataset_name, url)

    def _handle_zip_download(
        self, response, dataset_name: str, url: str
    ) -> gpd.GeoDataFrame:
        """Extract and process ZIP archives containing shapefiles."""
        import tempfile
        import zipfile
        from pathlib import Path

        # Save ZIP to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp_zip:
            for chunk in response.iter_content(chunk_size=8192):
                tmp_zip.write(chunk)
            tmp_zip_path = Path(tmp_zip.name)

        # Extract to temp directory
        extract_dir = Path(tempfile.mkdtemp())

        try:
            with zipfile.ZipFile(tmp_zip_path, "r") as zip_ref:
                zip_ref.extractall(extract_dir)

            # Find shapefile
            shapefiles = list(extract_dir.glob("**/*.shp"))
            if shapefiles:
                logger.info(f"Found shapefile: {shapefiles[0].name}")
                gdf = gpd.read_file(shapefiles[0])
            else:
                # Try GeoJSON
                geojsons = list(extract_dir.glob("**/*.geojson")) + list(
                    extract_dir.glob("**/*.json")
                )
                if geojsons:
                    logger.info(f"Found GeoJSON: {geojsons[0].name}")
                    gdf = gpd.read_file(geojsons[0])
                else:
                    raise ValueError("No shapefile or GeoJSON found in ZIP archive")

            self._log_retrieval(
                dataset_name, True, f"Extracted and loaded {len(gdf)} features from ZIP"
            )
            return self._process_gdf(gdf, dataset_name, url)

        finally:
            # Cleanup
            tmp_zip_path.unlink(missing_ok=True)
            import shutil

            shutil.rmtree(extract_dir, ignore_errors=True)

    def _process_gdf(
        self, gdf: gpd.GeoDataFrame, dataset_name: str, url: str
    ) -> gpd.GeoDataFrame:
        """Process and clean the GeoDataFrame."""
        # Clean the GDF
        gdf = self._clean_gdf(gdf)

        # Handle CRS - many CCT datasets use Hartebeesthoek94 (EPSG:2048) or WGS84
        if gdf.crs is None:
            logger.warning(f"No CRS detected for {dataset_name}. Assuming EPSG:4326")
            gdf.set_crs(epsg=4326, inplace=True)
        elif gdf.crs.to_epsg() not in [4326, 3857]:  # Not in common web CRS
            logger.info(f"Reprojecting {dataset_name} from {gdf.crs} to EPSG:4326")
            try:
                gdf = gdf.to_crs(epsg=4326)
            except Exception as e:
                logger.error(f"CRS reprojection failed: {e}. Attempting to override.")
                gdf.set_crs(epsg=4326, inplace=True, allow_override=True)
        elif gdf.crs != settings.TARGET_CRS:
            gdf = gdf.to_crs(settings.TARGET_CRS)

        # Save processed
        processed_path = cache_manager.get_processed_path(dataset_name)
        gdf.to_file(processed_path, driver="GeoJSON")

        # Update metadata
        cache_manager.update_metadata(
            dataset_name,
            {
                "source_url": url,
                "feature_count": len(gdf),
                "bounds": list(gdf.total_bounds) if not gdf.empty else None,
                "downloaded_at": datetime.utcnow().isoformat(),
            },
        )

        return gdf

    def _clean_gdf(self, gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """Basic cleaning and geometry validation."""
        if gdf.empty:
            return gdf

        # Fix invalid geometries
        gdf["geometry"] = gdf["geometry"].apply(
            lambda g: g if g is None or g.is_valid else g.buffer(0)
        )

        # Drop empty geometries
        gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notnull()]

        return gdf

    def check_data_source_health(self, dataset_name: str) -> Dict[str, Any]:
        """Check if a data source is accessible and responding."""
        if dataset_name not in self.data_urls:
            return {
                "status": "error",
                "message": "Dataset not configured",
                "accessible": False,
            }

        url = self.data_urls[dataset_name]
        try:
            response = requests.head(url, timeout=10)
            return {
                "status": "ok" if response.ok else "error",
                "accessible": response.ok,
                "status_code": response.status_code,
                "url": url,
                "checked_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {
                "status": "error",
                "accessible": False,
                "error": str(e),
                "url": url,
                "checked_at": datetime.utcnow().isoformat(),
            }

    def check_all_sources_health(self) -> Dict[str, Dict[str, Any]]:
        """Check health of all configured data sources."""
        results = {}
        for dataset_name in self.data_urls:
            results[dataset_name] = self.check_data_source_health(dataset_name)
        return results

    async def check_data_source_health_async(
        self, dataset_name: str, client: Optional[httpx.AsyncClient] = None
    ) -> Dict[str, Any]:
        """Check if a data source is accessible and responding asynchronously."""
        if dataset_name not in self.data_urls:
            return {
                "status": "error",
                "message": "Dataset not configured",
                "accessible": False,
            }

        url = self.data_urls[dataset_name]

        try:
            if client:
                response = await client.head(url, timeout=10)
            else:
                async with httpx.AsyncClient() as local_client:
                    response = await local_client.head(url, timeout=10)

            is_ok = response.is_success or response.is_redirect

            return {
                "status": "ok" if is_ok else "error",
                "accessible": is_ok,
                "status_code": response.status_code,
                "url": url,
                "checked_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {
                "status": "error",
                "accessible": False,
                "error": str(e),
                "url": url,
                "checked_at": datetime.utcnow().isoformat(),
            }

    async def check_all_sources_health_async(self) -> Dict[str, Dict[str, Any]]:
        """Check health of all configured data sources asynchronously."""
        async with httpx.AsyncClient() as client:
            tasks = []
            keys = list(self.data_urls.keys())
            for dataset_name in keys:
                tasks.append(self.check_data_source_health_async(dataset_name, client))

            results_list = await asyncio.gather(*tasks)

            results = {}
            for i, dataset_name in enumerate(keys):
                results[dataset_name] = results_list[i]
            return results


# Singleton instance for global use
data_loader = DataLoader()
