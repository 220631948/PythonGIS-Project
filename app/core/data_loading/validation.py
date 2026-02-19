from datetime import datetime
from typing import Dict, Any, List
import geopandas as gpd

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

class DataValidator:
    """Validates spatial data quality."""

    def validate_gdf(self, gdf: gpd.GeoDataFrame, dataset_name: str) -> DataValidationResult:
        """Validate a GeoDataFrame for data quality."""
        result = DataValidationResult()

        # Check if empty
        if gdf.empty:
            result.add_warning(
                "Dataset is empty - no features returned from open data source"
            )
            return result

        # Check geometry validity
        # Assuming 'geometry' is the active geometry column
        if hasattr(gdf, "geometry"):
            invalid_geoms = (~gdf.geometry.is_valid).sum()
            if invalid_geoms > 0:
                result.add_warning(
                    f"{invalid_geoms} invalid geometries detected (will be auto-fixed)"
                )

            # Check for empty geometries
            empty_geoms = gdf.geometry.is_empty.sum()
            if empty_geoms > 0:
                result.add_warning(f"{empty_geoms} empty geometries detected")

            # Check for null geometries
            null_geoms = gdf.geometry.isnull().sum()
            if null_geoms > 0:
                result.add_warning(f"{null_geoms} null geometries detected")
        else:
            result.add_error("No geometry column found in GeoDataFrame")

        # Check CRS
        if gdf.crs is None:
            result.add_error("No coordinate reference system (CRS) defined")

        # Statistics
        result.stats = {
            "feature_count": len(gdf),
            "geometry_type": str(gdf.geom_type.mode()[0]) if not gdf.empty and hasattr(gdf, "geometry") else None,
            "crs": str(gdf.crs) if gdf.crs else None,
            "bounds": list(gdf.total_bounds) if not gdf.empty and hasattr(gdf, "geometry") else None,
            "columns": list(gdf.columns),
            "validated_at": datetime.utcnow().isoformat(),
        }

        return result
