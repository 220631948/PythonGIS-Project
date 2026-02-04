import logging
from typing import Any, Dict, List
import geopandas as gpd
from app.spatial_analysis.base import BaseAnalyzer
from app.spatial_analysis.spatial_utils import gdf_to_geojson
from app.config import settings

logger = logging.getLogger(__name__)

class InfrastructureAnalyzer(BaseAnalyzer):
    def __init__(self):
        super().__init__("infrastructure")

    def run_analysis(self, **kwargs) -> Dict[str, Any]:
        """Generic analysis for infrastructure layers."""
        dataset_name = kwargs.get("dataset_name")
        if not dataset_name:
            return {"error": "Dataset name required"}
            
        gdf = self.load_dataset(dataset_name)
        
        # Apply simplification if requested
        simplify = kwargs.get("simplify", 0.0)
        if simplify > 0:
            gdf = gdf.copy()
            gdf['geometry'] = gdf['geometry'].simplify(simplify, preserve_topology=True)
            
        return {
            "geojson": gdf_to_geojson(gdf),
            "metadata": self.get_metadata(dataset_name)
        }

    def get_layer(self, layer_id: str, simplify: float = 0.0) -> Dict[str, Any]:
        """Loads and returns a specific infrastructure layer as GeoJSON."""
        return self.run_analysis(dataset_name=layer_id, simplify=simplify)

infrastructure_analyzer = InfrastructureAnalyzer()
