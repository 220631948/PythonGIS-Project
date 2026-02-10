import logging
from typing import Dict, Any, Optional
from app.spatial_analysis.base import BaseAnalyzer
from app.spatial_analysis.spatial_utils import gdf_to_geojson
from app.config import settings

logger = logging.getLogger(__name__)

class UtilitiesAnalyzer(BaseAnalyzer):
    def __init__(self):
        super().__init__("utilities")

    def run_analysis(self, simplify: Optional[float] = None) -> Dict[str, Any]:
        """
        Analyzes waste collection and recycling facility accessibility.
        """
        try:
            waste = self.load_dataset("waste_collection")
            recycling = self.load_dataset("recycling_facilities")
            
            # Transform and simplify for output
            results = waste.to_crs(settings.TARGET_CRS)
            if simplify:
                results.geometry = results.geometry.simplify(simplify)
            elif settings.SIMPLIFICATION_TOLERANCE:
                results.geometry = results.geometry.simplify(settings.SIMPLIFICATION_TOLERANCE)

            return {
                "geojson": gdf_to_geojson(results),
                "recycling_locations": gdf_to_geojson(recycling) if not recycling.empty else None,
                "summary": {
                    "total_collection_areas": len(waste),
                    "total_recycling_facilities": len(recycling)
                },
                "metadata": {
                    "waste_collection": self.get_metadata("waste_collection"),
                    "recycling_facilities": self.get_metadata("recycling_facilities")
                }
            }
        except Exception as e:
            logger.error(f"Utilities analysis failed: {e}")
            return {"error": str(e)}

utilities_analyzer = UtilitiesAnalyzer()
