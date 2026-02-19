import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple

import pandas as pd
import geopandas as gpd
import httpx

from app.config import settings
from app.core.cache_manager import cache_manager
from app.core.exceptions import DataNotFoundError, DataValidationError

# Import new components
from app.core.data_loading.logger import DataRetrievalLogger
from app.core.data_loading.validation import DataValidator, DataValidationResult
from app.core.data_loading.storage import SpatialDataStorage
from app.core.data_loading.processor import DataProcessor
from app.core.data_loading.fetcher import DataFetcher

logger = logging.getLogger(__name__)

class DataLoader:
    def __init__(self):
        self.data_urls = settings.DATA_URLS

        # Initialize components
        self.retrieval_logger = DataRetrievalLogger()
        self.storage = SpatialDataStorage()
        self.validator = DataValidator()
        self.processor = DataProcessor()
        self.fetcher = DataFetcher(self.data_urls, self.retrieval_logger)

    def get_paginated_gdf(
        self,
        dataset_name: str,
        limit: int = 1000,
        offset: int = 0,
        force_refresh: bool = False,
    ) -> Tuple[gpd.GeoDataFrame, int]:
        """Returns a paginated GeoDataFrame and total count."""

        if dataset_name not in self.data_urls:
            self.retrieval_logger.log_retrieval(dataset_name, False, "Dataset not configured")
            raise DataNotFoundError(
                f"Dataset '{dataset_name}' not configured in DATA_URLS."
            )

        # Validate table name early to prevent injection in downstream SQL
        try:
            self.storage.validate_table_name(dataset_name)
        except ValueError as e:
            raise e

        # 1. Try PostGIS (Optimized path)
        if not force_refresh and self.storage.table_exists(dataset_name):
            try:
                total_count = self.storage.get_record_count(dataset_name)
                gdf = self.storage.get_paginated_from_postgis(dataset_name, limit, offset)

                self.retrieval_logger.log_retrieval(
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
            self.retrieval_logger.log_retrieval(dataset_name, False, "Dataset not configured")
            raise DataNotFoundError(
                f"Dataset '{dataset_name}' not configured in DATA_URLS."
            )

        # Validate table name early
        self.storage.validate_table_name(dataset_name)

        # Try to load from PostGIS database first
        if not force_refresh:
            try:
                if self.storage.table_exists(dataset_name):
                    gdf = self.storage.read_from_postgis(dataset_name)
                    self.retrieval_logger.log_retrieval(dataset_name, True, "Loaded from PostGIS")
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
                self.retrieval_logger.log_retrieval(dataset_name, True, "Loaded from cache")
                return gdf
            except Exception as e:
                logger.warning(
                    f"Failed to load cached {dataset_name}: {e}. Redownloading..."
                )

        # Download and process from live open data source
        # Fetch raw GDF
        raw_gdf = self.fetcher.fetch_gdf(dataset_name)

        # Process GDF (clean, CRS, save to file cache)
        url = self.data_urls[dataset_name]
        gdf = self.processor.process_gdf(raw_gdf, dataset_name, url)

        # Validate the data
        validation = self.validate_gdf(gdf, dataset_name)
        if not validation.is_valid:
            logger.error(
                f"Data validation failed for {dataset_name}: {validation.errors}"
            )
            self.retrieval_logger.log_retrieval(
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
            self.storage.save_to_postgis(gdf, dataset_name, source_url=url)
        except Exception as e:
            logger.error(f"Failed to save {dataset_name} to PostGIS: {e}")

        # Return the GeoDataFrame so callers can use the loaded data
        return gdf

    def load_csv(self, dataset_name: str) -> pd.DataFrame:
        """Load tabular data (CSV/Excel) from configured source."""
        return self.fetcher.load_csv(dataset_name)

    def validate_gdf(
        self, gdf: gpd.GeoDataFrame, dataset_name: str
    ) -> DataValidationResult:
        """Validate a GeoDataFrame for data quality."""
        return self.validator.validate_gdf(gdf, dataset_name)

    def get_retrieval_log(self) -> List[Dict[str, Any]]:
        """Get the data retrieval log for monitoring."""
        return self.retrieval_logger.get_log()

    def check_data_source_health(self, dataset_name: str) -> Dict[str, Any]:
        """Check if a data source is accessible and responding."""
        return self.fetcher.check_data_source_health(dataset_name)

    def check_all_sources_health(self) -> Dict[str, Dict[str, Any]]:
        """Check health of all configured data sources."""
        return self.fetcher.check_all_sources_health()

    async def check_data_source_health_async(
        self, dataset_name: str, client: Optional[httpx.AsyncClient] = None
    ) -> Dict[str, Any]:
        """Check if a data source is accessible and responding asynchronously."""
        return await self.fetcher.check_data_source_health_async(dataset_name, client)

    async def check_all_sources_health_async(self) -> Dict[str, Dict[str, Any]]:
        """Check health of all configured data sources asynchronously."""
        return await self.fetcher.check_all_sources_health_async()


# Singleton instance for global use
data_loader = DataLoader()
