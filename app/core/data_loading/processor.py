import logging
from datetime import datetime
import geopandas as gpd
from app.config import settings
from app.core.cache_manager import cache_manager

logger = logging.getLogger(__name__)

class DataProcessor:
    """Processes and cleans spatial data."""

    def process_gdf(
        self, gdf: gpd.GeoDataFrame, dataset_name: str, url: str
    ) -> gpd.GeoDataFrame:
        """Process and clean the GeoDataFrame."""
        # Clean the GDF
        gdf = self._clean_gdf(gdf)

        if gdf.empty:
            logger.warning(f"Dataset {dataset_name} is empty. Skipping CRS processing.")
            return gdf

        # Handle CRS - many CCT datasets use Hartebeesthoek94 (EPSG:2048) or WGS84
        if gdf.crs is None:
            logger.warning(f"No CRS detected for {dataset_name}. Assuming EPSG:4326")
            gdf.set_crs(epsg=4326, inplace=True)

        # Proactively convert any pandas.StringDtype columns to object before serialization/projection
        for col in gdf.columns:
            if (
                col != "geometry"
                and hasattr(gdf[col], "dtype")
                and "string" in str(gdf[col].dtype).lower()
            ):
                gdf[col] = gdf[col].astype(object)

        if gdf.crs.to_epsg() not in [4326, 3857]:  # Not in common web CRS
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
                "bounds": list(gdf.total_bounds) if not gdf.empty and hasattr(gdf, "geometry") else None,
                "downloaded_at": datetime.utcnow().isoformat(),
            },
        )

        return gdf

    def _clean_gdf(self, gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """Basic cleaning and geometry validation."""
        if gdf.empty:
            return gdf

        if not hasattr(gdf, "geometry"):
            return gdf

        # Fix invalid geometries
        gdf["geometry"] = gdf["geometry"].apply(
            lambda g: g if g is None or g.is_valid else g.buffer(0)
        )

        # Drop empty geometries
        gdf = gdf[~gdf.geometry.is_empty & gdf.geometry.notnull()]

        return gdf
