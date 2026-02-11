import logging
import pandas as pd
from typing import Dict, Any, Optional
from app.spatial_analysis.base import BaseAnalyzer
from app.config import settings
from app.spatial_analysis.spatial_utils import gdf_to_geojson

logger = logging.getLogger(__name__)

class LandUseAnalyzer(BaseAnalyzer):
    def __init__(self):
        super().__init__("land_use")

    def run_analysis(self, simplify: Optional[float] = None) -> Dict[str, Any]:
        """
        Summarizes land use by zoning category.
        """
        try:
            zoning = self.load_dataset("zoning")
            
            if zoning.empty:
                return {"error": "No zoning data found"}

            # Summary by category
            if 'zoning_category' in zoning.columns:
                summary = zoning.groupby('zoning_category').size().reset_index(name='count')
            else:
                # Fallback if column names differ
                summary = pd.DataFrame({"message": ["Zoning category column not found"]})

            # Simplify for delivery
            results = zoning.to_crs(settings.TARGET_CRS)
            if simplify:
                results.geometry = results.geometry.simplify(simplify)
            elif settings.SIMPLIFICATION_TOLERANCE:
                results.geometry = results.geometry.simplify(settings.SIMPLIFICATION_TOLERANCE)

            # Proactively convert any pandas.StringDtype columns to object
            # This fixes "Cannot interpret '<StringDtype...>' as a data type"
            for col in results.columns:
                if (
                    col != "geometry"
                    and hasattr(results[col], "dtype")
                    and "string" in str(results[col].dtype).lower()
                ):
                    results[col] = results[col].astype(object)

            return {
                "geojson": gdf_to_geojson(results),
                "summary": summary.to_dict(orient='records'),
                "metadata": {
                    "zoning": self.get_metadata("zoning")
                }
            }
        except Exception as e:
            logger.error(f"Land use analysis failed: {e}")
            return {"error": str(e)}

land_use_analyzer = LandUseAnalyzer()
