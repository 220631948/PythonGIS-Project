import logging
import geopandas as gpd
from typing import Dict, Any, Optional
from app.spatial_analysis.base import BaseAnalyzer
from app.spatial_analysis.spatial_utils import gdf_to_geojson
from app.config import settings

logger = logging.getLogger(__name__)

class EnvironmentAnalyzer(BaseAnalyzer):
    def __init__(self):
        super().__init__("environment")

    def run_analysis(self, simplify: Optional[float] = None) -> Dict[str, Any]:
        """
        Intersects flood zones with suburbs and calculates % area at risk.
        """
        try:
            suburbs = self.load_dataset("suburbs")
            flood_zones = self.load_dataset("flood_zones")
            
            if suburbs.empty or flood_zones.empty:
                return {"error": "Suburbs or flood zones data missing"}

            # Project for area calculation
            suburbs_proj = suburbs.to_crs(settings.PROJECTED_CRS)
            flood_proj = flood_zones.to_crs(settings.PROJECTED_CRS)
            
            # Calculate original area
            suburbs_proj['total_area'] = suburbs_proj.geometry.area
            
            # Intersection overlay
            logger.info("Performing flood risk overlay analysis...")
            risk_intersect = gpd.overlay(suburbs_proj, flood_proj, how='intersection')
            
            if not risk_intersect.empty:
                risk_intersect['risk_area'] = risk_intersect.geometry.area
                # Aggregate back to suburb (assume 'name' is the unique identifier)
                risk_by_suburb = risk_intersect.groupby('name')['risk_area'].sum().reset_index()
                # Join back to suburbs
                results = suburbs_proj.merge(risk_by_suburb, on='name', how='left')
            else:
                results = suburbs_proj.copy()
                results['risk_area'] = 0
                
            results['risk_area'] = results['risk_area'].fillna(0)
            results['risk_percentage'] = (results['risk_area'] / results['total_area']) * 100
            
            # Classification
            results['risk_level'] = results['risk_percentage'].apply(
                lambda x: "High" if x > 20 else ("Medium" if x > 5 else "Low")
            )

            # Cleanup and output
            results_out = results.to_crs(settings.TARGET_CRS)
            if simplify:
                results_out.geometry = results_out.geometry.simplify(simplify)
            elif settings.SIMPLIFICATION_TOLERANCE:
                results_out.geometry = results_out.geometry.simplify(settings.SIMPLIFICATION_TOLERANCE)

            return {
                "geojson": gdf_to_geojson(results_out),
                "summary": {
                    "avg_risk_percentage": float(results['risk_percentage'].mean()),
                    "high_risk_suburbs": int((results['risk_level'] == "High").sum())
                },
                "metadata": {
                    "suburbs": self.get_metadata("suburbs"),
                    "flood_zones": self.get_metadata("flood_zones")
                }
            }
        except Exception as e:
            logger.error(f"Environment analysis failed: {e}")
            return {"error": str(e)}

environment_analyzer = EnvironmentAnalyzer()
