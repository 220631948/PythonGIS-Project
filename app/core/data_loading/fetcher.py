import asyncio
import json
import logging
import shutil
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

import httpx
import requests
import pandas as pd
import geopandas as gpd

from app.config import settings
from app.core.exceptions import DataNotFoundError
from app.core.data_loading.logger import DataRetrievalLogger

logger = logging.getLogger(__name__)

class DataFetcher:
    """Handles fetching of data from external sources."""

    def __init__(self, data_urls: Dict[str, str], retrieval_logger: DataRetrievalLogger):
        self.data_urls = data_urls
        self.retrieval_logger = retrieval_logger

    def fetch_gdf(self, dataset_name: str) -> gpd.GeoDataFrame:
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
            self.retrieval_logger.log_retrieval(dataset_name, False, f"Request timeout: {e}")
            raise DataNotFoundError(
                f"Timeout downloading {dataset_name} from {url}. The open data service may be unavailable."
            )
        except requests.exceptions.HTTPError as e:
            self.retrieval_logger.log_retrieval(dataset_name, False, f"HTTP error: {e}")
            raise DataNotFoundError(
                f"HTTP error downloading {dataset_name}: {e}. Check if the open data endpoint is accessible."
            )
        except requests.exceptions.RequestException as e:
            self.retrieval_logger.log_retrieval(dataset_name, False, f"Request failed: {e}")
            # Try local raw file as fallback (previously downloaded real data)
            raw_path = settings.RAW_DATA_DIR / f"{dataset_name}.geojson"
            if raw_path.exists():
                logger.info(f"Using previously downloaded data for {dataset_name}")
                gdf = gpd.read_file(raw_path)
                self.retrieval_logger.log_retrieval(
                    dataset_name, True, "Loaded from local cache (network unavailable)"
                )
                return gdf
            else:
                raise DataNotFoundError(
                    f"Failed to download {dataset_name} from {url} and no cached data available. "
                    f"Error: {e}. Please check network connectivity and the open data source URL."
                )
        except json.JSONDecodeError as e:
            self.retrieval_logger.log_retrieval(dataset_name, False, f"Invalid JSON response: {e}")
            raise DataNotFoundError(
                f"Invalid JSON response from {url}. The open data format may have changed."
            )

        # Save raw data
        raw_path = settings.RAW_DATA_DIR / f"{dataset_name}.geojson"
        with open(raw_path, "w") as f:
            json.dump(data, f)

        # Try standard geopandas read first
        try:
            gdf = gpd.read_file(raw_path)
            self.retrieval_logger.log_retrieval(
                dataset_name, True, f"Downloaded {len(gdf)} features from open data source (via geopandas)"
            )
        except Exception as e:
            logger.warning(
                f"gpd.read_file failed for {dataset_name}: {e}. Attempting GeoJSON fallback parser."
            )
            try:
                gdf = self._parse_geojson_fallback(data, dataset_name)
                self.retrieval_logger.log_retrieval(
                    dataset_name,
                    True,
                    f"Downloaded {len(gdf)} features from open data source (via fallback parser)",
                )
            except Exception as e2:
                self.retrieval_logger.log_retrieval(dataset_name, False, f"GeoJSON fallback parse failed: {e2}")
                logger.error(
                    f"Failed to parse GeoJSON for {dataset_name}: {e2}. Returning empty dataset."
                )
                return gpd.GeoDataFrame(columns=["geometry"], crs="EPSG:4326")

        return gdf

    def _parse_geojson_fallback(self, data: Dict[str, Any], dataset_name: str) -> gpd.GeoDataFrame:
        from shapely.geometry import shape
        features = data.get("features", []) if isinstance(data, dict) else []

        if not features:
            logger.warning(f"No features found in GeoJSON for {dataset_name}")
            return gpd.GeoDataFrame(columns=["geometry"], crs="EPSG:4326")

        rows = []
        for feat in features:
            geom = None
            if feat.get("geometry"):
                try:
                    geom = shape(feat["geometry"])
                except Exception:
                    geom = None
            props = (
                feat.get("properties", {})
                if isinstance(feat.get("properties"), dict)
                else {}
            )
            props["geometry"] = geom
            rows.append(props)

        # Convert to DataFrame first
        df = pd.DataFrame(rows)

        # Proactively convert ALL non-geometry string columns to object dtype
        for col in df.columns:
            if col != "geometry":
                if hasattr(df[col], "dtype"):
                    dtype_str = str(df[col].dtype).lower()
                    if "string" in dtype_str or "object" not in dtype_str and df[col].dtype == object:
                        try:
                            df[col] = df[col].astype(object)
                        except Exception:
                            pass

        gdf = gpd.GeoDataFrame(df, crs="EPSG:4326")

        # Double-check
        for col in gdf.columns:
            if col != "geometry" and hasattr(gdf[col], "dtype") and "string" in str(gdf[col].dtype).lower():
                gdf[col] = gdf[col].astype(object)

        return gdf

    def _handle_zip_download(
        self, response, dataset_name: str, url: str
    ) -> gpd.GeoDataFrame:
        """Extract and process ZIP archives containing shapefiles."""
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

            self.retrieval_logger.log_retrieval(
                dataset_name, True, f"Extracted and loaded {len(gdf)} features from ZIP"
            )
            return gdf

        finally:
            # Cleanup
            tmp_zip_path.unlink(missing_ok=True)
            shutil.rmtree(extract_dir, ignore_errors=True)

    def load_csv(self, dataset_name: str) -> pd.DataFrame:
        """Load tabular data (CSV/Excel) from configured source."""
        if dataset_name not in self.data_urls:
            raise DataNotFoundError(
                f"Dataset '{dataset_name}' not configured in DATA_URLS."
            )

        url = self.data_urls[dataset_name]
        logger.info(f"Loading CSV data for {dataset_name} from {url}")

        try:
            # Check cache first (CSV implementation would ideally share cache logic)
            # For simplicity in this phase, we fetch directly or use a simple file cache
            df = pd.read_csv(url)
            self.retrieval_logger.log_retrieval(dataset_name, True, f"Loaded {len(df)} rows from CSV")
            return df

        except Exception as e:
            self.retrieval_logger.log_retrieval(dataset_name, False, f"CSV load failed: {e}")
            logger.error(f"Failed to load CSV {dataset_name}: {e}")
            raise DataNotFoundError(f"Failed to load CSV {dataset_name}: {e}")

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
