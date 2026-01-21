import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import geopandas as gpd
from app.core.data_loader import data_loader
from app.core.cache_manager import cache_manager
from app.config import settings

logger = logging.getLogger(__name__)

class BaseAnalyzer(ABC):
    def __init__(self, module_name: str):
        self.module_name = module_name

    def load_dataset(self, dataset_name: str) -> gpd.GeoDataFrame:
        """Helper to load dataset via DataLoader."""
        return data_loader.get_gdf(dataset_name)

    def get_metadata(self, dataset_name: str) -> Dict[str, Any]:
        """Helper to get dataset metadata."""
        return cache_manager.get_metadata(dataset_name)

    @abstractmethod
    def run_analysis(self, **kwargs) -> Dict[str, Any]:
        """Execute the primary analysis for this module."""
        pass
