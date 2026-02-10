import logging
import geopandas as gpd
from shapely.geometry import LineString, MultiLineString
from typing import Dict, Any
from app.spatial_analysis.base import BaseAnalyzer

logger = logging.getLogger(__name__)


class TransportOptimizer(BaseAnalyzer):
    """
    Optimizes transport route geometries.
    Reduces file size by simplifying geometry while preserving topological accuracy.
    """

    def __init__(self):
        super().__init__("transport")

    def run_analysis(self, **kwargs) -> Dict[str, Any]:
        """
        Compatibility method for BaseAnalyzer interface.
        Optimizes MyCiti routes by default.
        """
        simplify = kwargs.get("simplify", 0.0001)
        try:
            gdf = self.load_dataset("myciti_routes")
            optimized = self.optimize_routes(gdf, tolerance=simplify)
            import json

            return json.loads(optimized.to_json())
        except Exception as e:
            logger.error(f"Transport analysis failed: {e}")
            return {"error": str(e)}

    def optimize_routes(
        self, routes_gdf: gpd.GeoDataFrame, tolerance: float = 0.0001
    ) -> gpd.GeoDataFrame:
        """
        Simplify route geometries to reduce payload size.

        Args:
            routes_gdf: GeoDataFrame of transport routes
            tolerance: Simplification tolerance in degrees (default 0.0001 ~= 10m)

        Returns:
            Optimized GeoDataFrame
        """
        if routes_gdf.empty:
            return routes_gdf

        original_vertices = self._count_vertices(routes_gdf)
        logger.info(
            f"Optimizing {len(routes_gdf)} routes. Original vertices: {original_vertices}"
        )

        # Create copy and ensure valid geometry
        optimized = routes_gdf.copy()

        # 1. Simplify
        optimized.geometry = optimized.geometry.simplify(
            tolerance, preserve_topology=True
        )

        # 2. Filter ghost routes (zero length)
        # Note: In EPSG:4326 length calculation is degrees, strict 0 check is safe
        optimized = optimized[optimized.geometry.length > 0]

        # 3. Clean attributes (optional, keeps JSON small)
        # Assuming we want to keep specific standard GTFS-like columns if they exist
        keep_cols = [
            "route_id",
            "route_short_name",
            "route_long_name",
            "route_type",
            "color",
            "agency_id",
            "OBJECTID",
            "Route",
            "Shape_Length",
        ]

        # Keep columns that exist in the dataframe
        cols_to_keep = [c for c in keep_cols if c in optimized.columns]

        # Always keep geometry
        if cols_to_keep:
            optimized = optimized[cols_to_keep + ["geometry"]]

        final_vertices = self._count_vertices(optimized)
        reduction = (1 - final_vertices / original_vertices) * 100

        logger.info(
            f"Optimization complete. Final vertices: {final_vertices} ({reduction:.1f}% reduction)"
        )

        return optimized

    def _count_vertices(self, gdf: gpd.GeoDataFrame) -> int:
        """Count total vertices in GeoDataFrame."""
        total = 0
        for geom in gdf.geometry:
            if geom is None:
                continue
            if isinstance(geom, LineString):
                total += len(geom.coords)
            elif isinstance(geom, MultiLineString):
                for part in geom.geoms:
                    total += len(part.coords)
        return total


# Singleton instance
transport_optimizer = TransportOptimizer()
# Compatibility alias for existing API modules
transport_analyzer = transport_optimizer
