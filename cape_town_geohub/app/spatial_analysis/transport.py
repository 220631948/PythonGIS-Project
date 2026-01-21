import logging
import pandas as pd
import geopandas as gpd
from typing import Dict, Any, Optional
from shapely.geometry import Point
from app.spatial_analysis.base import BaseAnalyzer
from app.spatial_analysis.spatial_utils import create_buffer, gdf_to_geojson
from app.config import settings

logger = logging.getLogger(__name__)

class TransportAnalyzer(BaseAnalyzer):
    def __init__(self):
        super().__init__("transport")

    def run_analysis(self, lat: float, lon: float, simplify: Optional[float] = None) -> Dict[str, Any]:
        """
        Analyzes transport accessibility (MyCiTi stops) for a given location.
        """
        try:
            point = Point(lon, lat)
            stops = self.load_dataset("myciti_stops")
            rail = self.load_dataset("rail_stations")
            
            # Create buffers (800m, 1600m, 2400m)
            distances = [800, 1600, 2400]
            buffer_gdfs = []
            stop_counts = {}
            
            for dist in distances:
                buf_geom = create_buffer(point, dist)
                buf_gdf = gpd.GeoDataFrame(geometry=[buf_geom], crs=settings.TARGET_CRS)
                
                # Count stops within buffer
                if not stops.empty:
                    within_stops = stops[stops.geometry.within(buf_geom)]
                    stop_counts[f"{dist}m"] = len(within_stops)
                else:
                    stop_counts[f"{dist}m"] = 0
                
                buffer_gdfs.append(buf_gdf)

            # Combined buffers for output
            all_buffers = gpd.GeoDataFrame(pd.concat(buffer_gdfs, ignore_index=True), crs=settings.TARGET_CRS)
            all_buffers['distance'] = distances
            
            # Accessibility Score calculation
            # Max 100. Bonus for stops in 800m, smaller bonus for further.
            score = min(100, (stop_counts["800m"] * 20) + (stop_counts["1600m"] * 5))
            
            # Rail access bonus - calculate distance in projected CRS for accuracy
            if not rail.empty:
                # Project to UTM for accurate distance calculation in meters
                rail_proj = rail.to_crs(settings.PROJECTED_CRS)
                point_proj = gpd.GeoDataFrame(geometry=[point], crs=settings.TARGET_CRS).to_crs(settings.PROJECTED_CRS).geometry.iloc[0]
                nearest_rail_dist_m = rail_proj.distance(point_proj).min()
                
                if nearest_rail_dist_m < 1000:
                    score = min(100, score + 30)

            return {
                "geojson": gdf_to_geojson(all_buffers),
                "summary": {
                    "stop_counts": stop_counts,
                    "accessibility_score": score,
                    "level": "Excellent" if score > 80 else ("Good" if score > 50 else ("Adequate" if score > 20 else "Poor"))
                },
                "metadata": {
                    "stops": self.get_metadata("myciti_stops"),
                    "rail": self.get_metadata("rail_stations")
                }
            }
        except Exception as e:
            logger.error(f"Transport analysis failed: {e}")
            return {"error": str(e)}

transport_analyzer = TransportAnalyzer()
