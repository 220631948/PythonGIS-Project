import logging
import geopandas as gpd
from typing import Dict, Any, Optional
from app.spatial_analysis.base import BaseAnalyzer
from app.spatial_analysis.spatial_utils import gdf_to_geojson
from app.config import settings

logger = logging.getLogger(__name__)


class SafetyAnalyzer(BaseAnalyzer):
    """
    Safety analysis using real open data sources.

    Note: Crime statistics in South Africa are published by SAPS (South African Police Service)
    and are typically aggregated at precinct level for privacy and ethical reasons.
    This analyzer uses suburb boundaries as spatial units and links to official SAPS data
    when available.
    """

    def __init__(self):
        super().__init__("safety")

    def run_analysis(self, simplify: Optional[float] = None) -> Dict[str, Any]:
        """
        Returns safety information by precinct/suburb.

        Ethical design:
        - No individual incident locations
        - Only precinct-level aggregates from official sources
        - Links to official SAPS statistics
        """
        try:
            # Load real suburb data from open data source
            precincts = self.load_dataset("suburbs")
            
            if precincts.empty:
                return {
                    "error": "No precinct/suburb data available",
                    "message": "Unable to load spatial boundaries from open data source",
                    "data_status": "unavailable"
                }

            # Note: Real crime statistics should be joined from SAPS data
            # SAPS publishes quarterly crime statistics at:
            # https://www.saps.gov.za/services/crimestats.php
            #
            # For production, implement integration with SAPS open data when available
            # Current implementation provides boundary data only

            # Reproject and simplify
            results = precincts.to_crs(settings.TARGET_CRS)
            if simplify:
                results.geometry = results.geometry.simplify(simplify)
            elif settings.SIMPLIFICATION_TOLERANCE:
                results.geometry = results.geometry.simplify(settings.SIMPLIFICATION_TOLERANCE)

            return {
                "geojson": gdf_to_geojson(results),
                "summary": {
                    "total_areas": len(results),
                    "data_type": "suburb_boundaries",
                    "crime_stats_available": False
                },
                "metadata": {
                    "boundary_source": "City of Cape Town Open Data Portal",
                    "boundary_url": settings.DATA_URLS.get("suburbs", ""),
                    "crime_stats_source": "South African Police Service (SAPS)",
                    "crime_stats_url": "https://www.saps.gov.za/services/crimestats.php",
                    "disclaimer": (
                        "This layer shows suburb boundaries only. "
                        "For official crime statistics, please visit the SAPS website. "
                        "Crime data is aggregated at precinct level for ethical and privacy reasons. "
                        "Individual incident locations are not displayed."
                    ),
                    "license": "City of Cape Town Open Data License",
                    "last_updated": self.get_metadata("suburbs").get("last_updated"),
                    "data_status": "live"
                }
            }
        except Exception as e:
            logger.error(f"Safety analysis failed: {e}")
            return {
                "error": str(e),
                "message": "Safety analysis failed. Please check data source availability.",
                "data_status": "error"
            }


safety_analyzer = SafetyAnalyzer()
