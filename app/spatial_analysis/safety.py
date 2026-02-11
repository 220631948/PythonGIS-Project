"""
Safety Analyzer - Crime Statistics Merger
Merges tabular crime data with precinct boundary shapefiles
"""

import logging
import geopandas as gpd
import pandas as pd
from typing import Optional, Dict, Any
from app.spatial_analysis.base import BaseAnalyzer
from app.core.data_loader import data_loader

logger = logging.getLogger(__name__)


class SafetyAnalyzer(BaseAnalyzer):
    """
    Merges crime statistics (CSV/Excel) with precinct boundaries (Shapefile).
    Produces enriched GeoDataFrame ready for choropleth mapping.
    """

    # Columns to explicitly drop for privacy
    SENSITIVE_COLUMNS = [
        "address",
        "street",
        "incident_location",
        "victim_name",
        "suspect_name",
        "complainant",
        "witness",
        "phone",
        "email",
    ]

    # Standard join columns to try
    JOIN_COLUMNS = [
        "PRECINCT_NAME",
        "precinct_name",
        "PRECINCT",
        "precinct",
        "Station",
        "STATION",
        "station_name",
        "STATION_NAME",
        "NAME",
        "name",
        "OFC_SBRB_NAME",
    ]

    def __init__(self):
        super().__init__("safety")

    def run_analysis(self, **kwargs) -> Dict[str, Any]:
        """
        Compatibility method for BaseAnalyzer interface.
        Merges precincts with crime stats by default.
        """
        try:
            precincts = data_loader.get_gdf("precincts")
            stats = data_loader.load_csv("crime_stats")
            merged = self.merge_stats_with_precincts(precincts, stats)
            import json

            return json.loads(merged.to_json())
        except Exception as e:
            logger.error(f"Safety analysis failed: {e}")
            return {"error": str(e)}

    def merge_stats_with_precincts(
        self,
        precinct_gdf: gpd.GeoDataFrame,
        stats_df: pd.DataFrame,
        join_column: Optional[str] = None,
    ) -> gpd.GeoDataFrame:
        """
        Merge crime statistics with precinct boundaries.

        Args:
            precinct_gdf: GeoDataFrame of precinct boundaries
            stats_df: DataFrame of crime statistics
            join_column: Optional explicit column to join on

        Returns:
            Merged GeoDataFrame with crime stats attached to precincts
        """
        logger.info(
            f"Merging {len(stats_df)} stats records with {len(precinct_gdf)} precincts"
        )

        # Make copies to avoid mutating originals
        precincts = precinct_gdf.copy()
        stats = stats_df.copy()

        # Find join column
        if join_column is None:
            join_column = self._find_join_column(precincts, stats)
            if join_column is None:
                logger.warning(
                    "Could not find matching join column. Returning precincts without stats."
                )
                return precincts

        logger.info(f"Joining on column: {join_column}")

        # Normalize join columns
        precincts, stats = self._normalize_join_columns(precincts, stats, join_column)

        # Remove sensitive columns from stats before merge
        stats = self._remove_sensitive_columns(stats)

        # Perform merge
        try:
            merged = precincts.merge(stats, on="_join_key", how="left")

            # Fill missing values
            merged = self._fill_missing_values(merged)

            # Calculate crime index if possible
            merged = self._calculate_crime_index(merged)

            logger.info(f"Merge successful: {len(merged)} precincts with stats")
            return merged

        except Exception as e:
            logger.error(f"Merge failed: {e}. Returning original precincts.")
            return precincts

    def _find_join_column(
        self, precincts: gpd.GeoDataFrame, stats: pd.DataFrame
    ) -> Optional[str]:
        """Find a common column to join on."""
        precinct_cols = set(c.upper() for c in precincts.columns)
        stats_cols = set(c.upper() for c in stats.columns)

        for candidate in self.JOIN_COLUMNS:
            candidate_upper = candidate.upper()
            if candidate_upper in precinct_cols and candidate_upper in stats_cols:
                return candidate

        # Try to find any common column
        common = precinct_cols & stats_cols
        common.discard("GEOMETRY")
        if common:
            return list(common)[0]

        return None

    def _normalize_join_columns(
        self, precincts: gpd.GeoDataFrame, stats: pd.DataFrame, join_column: str
    ) -> tuple:
        """Normalize join column values for matching."""
        # Find actual column names (case-insensitive)
        precinct_col = self._find_column(precincts, join_column)
        stats_col = self._find_column(stats, join_column)

        # Create normalized join key
        precincts["_join_key"] = (
            precincts[precinct_col].astype(str).str.upper().str.strip()
        )
        stats["_join_key"] = stats[stats_col].astype(str).str.upper().str.strip()

        return precincts, stats

    def _find_column(self, df: pd.DataFrame, target: str) -> str:
        """Find column matching target (case-insensitive)."""
        target_upper = target.upper()
        for col in df.columns:
            if col.upper() == target_upper:
                return col
        return target

    def _remove_sensitive_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove columns that might contain sensitive information."""
        cols_to_drop = []
        for col in df.columns:
            col_lower = col.lower()
            for sensitive in self.SENSITIVE_COLUMNS:
                if sensitive in col_lower:
                    cols_to_drop.append(col)
                    break

        if cols_to_drop:
            logger.info(f"Dropping sensitive columns: {cols_to_drop}")
            df = df.drop(columns=cols_to_drop, errors="ignore")

        return df

    def _fill_missing_values(self, gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """Fill missing values with sensible defaults."""
        for col in gdf.columns:
            if gdf[col].dtype in ["int64", "float64"]:
                gdf[col] = gdf[col].fillna(0)
            elif gdf[col].dtype == "object":
                gdf[col] = gdf[col].fillna("No Data")

        return gdf

    def _calculate_crime_index(self, gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
        """Calculate a crime index (0-100) if crime count columns exist."""
        # Look for crime count columns
        crime_cols = [
            c
            for c in gdf.columns
            if any(
                keyword in c.lower()
                for keyword in ["crime", "count", "incident", "offence", "case"]
            )
        ]

        if crime_cols:
            # Sum all crime columns
            gdf["total_crimes"] = (
                gdf[crime_cols].select_dtypes(include="number").sum(axis=1)
            )

            # Normalize to 0-100 index (higher = more crime)
            max_crimes = gdf["total_crimes"].max()
            if max_crimes > 0:
                gdf["crime_index"] = (
                    ((gdf["total_crimes"] / max_crimes) * 100).round(0).astype(int)
                )
            else:
                gdf["crime_index"] = 0

            # Add crime level
            gdf["crime_level"] = gdf["crime_index"].apply(
                lambda x: "Low"
                if x <= 35
                else ("Moderate" if x <= 60 else ("Elevated" if x <= 80 else "High"))
            )

            logger.info(f"Calculated crime_index from {len(crime_cols)} columns")

        return gdf


# Singleton instance
safety_analyzer = SafetyAnalyzer()
