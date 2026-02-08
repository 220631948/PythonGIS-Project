"""
Cape Town Open Data Portal Integration Module

This module provides functionality to discover, access, and import spatial datasets
from the City of Cape Town Open Data Portal (ArcGIS Open Data).

Portal URL: https://odp-cctegis.opendata.arcgis.com/
"""

import requests
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

# Cape Town Open Data Portal base URL
PORTAL_BASE_URL = "https://odp.capetown.gov.za/"
ARCGIS_REST_BASE = "https://citymaps.capetown.gov.za/agsext/rest/services"
EGIS_MAP_SERVICE = "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer"

class DatasetCategory(Enum):
    """Categories of datasets available in the portal"""
    IMAGERY = "imagery"
    BOUNDARIES = "boundaries"
    INFRASTRUCTURE = "infrastructure"
    ENVIRONMENT = "environment"
    PLANNING = "planning"
    TRANSPORT = "transport"
    SERVICES = "services"
    SAFETY = "safety"


@dataclass
class PortalDataset:
    """Represents a dataset from the Cape Town Open Data Portal"""
    id: str
    name: str
    description: str
    category: DatasetCategory
    url: str
    format: str  # GeoJSON, FeatureServer, MapServer, etc.
    geometry_type: str  # Point, Polygon, Line, Raster
    last_updated: Optional[str] = None
    attribution: str = "City of Cape Town"
    metadata_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


# Curated list of available datasets from Cape Town Open Data Portal
PORTAL_DATASETS: Dict[str, PortalDataset] = {
    # ============ IMAGERY ============
    "aerial_imagery_2023": PortalDataset(
        id="aerial_imagery_2023",
        name="Aerial Imagery 2023",
        description="High-resolution aerial imagery of Cape Town metropolitan area",
        category=DatasetCategory.IMAGERY,
        url=f"{ARCGIS_REST_BASE}/Imagery/Aerial_2023/MapServer",
        format="MapServer",
        geometry_type="Raster",
        attribution="City of Cape Town GIS",
    ),
    "aerial_imagery_historical": PortalDataset(
        id="aerial_imagery_historical",
        name="Historical Aerial Imagery",
        description="Historical aerial photographs for change detection",
        category=DatasetCategory.IMAGERY,
        url=f"{ARCGIS_REST_BASE}/Imagery/Historical_Aerials/MapServer",
        format="MapServer",
        geometry_type="Raster",
    ),
    # ============ BOUNDARIES ============
    "city_boundary": PortalDataset(
        id="city_boundary",
        name="City of Cape Town Boundary",
        description="Official municipal boundary of Cape Town",
        category=DatasetCategory.BOUNDARIES,
        url="https://services.arcgis.com/zmLUiqh7X11gGV2d/arcgis/rest/services/City_Boundary/FeatureServer/0",
        format="MapServer",
        geometry_type="Polygon",
    ),
    "suburbs": PortalDataset(
        id="suburbs",
        name="Official Suburb",
        description="Official suburb boundaries within Cape Town",
        category=DatasetCategory.BOUNDARIES,
        url=f"{EGIS_MAP_SERVICE}/75/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    "wards": PortalDataset(
        id="wards",
        name="Ward",
        description="Electoral ward boundaries",
        category=DatasetCategory.BOUNDARIES,
        url=f"{EGIS_MAP_SERVICE}/78/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    "subcouncils": PortalDataset(
        id="subcouncils",
        name="Sub Council",
        description="Subcouncil administrative boundaries",
        category=DatasetCategory.BOUNDARIES,
        url=f"{EGIS_MAP_SERVICE}/77/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    # ============ INFRASTRUCTURE ============
    "roads": PortalDataset(
        id="roads",
        name="Road Network",
        description="Primary and secondary road network",
        category=DatasetCategory.INFRASTRUCTURE,
        url=f"{ARCGIS_REST_BASE}/Infrastructure/Roads/MapServer/0",
        format="MapServer",
        geometry_type="Line",
    ),
    "buildings": PortalDataset(
        id="buildings",
        name="Building Footprints",
        description="Building footprints across the city",
        category=DatasetCategory.INFRASTRUCTURE,
        url=f"{ARCGIS_REST_BASE}/Infrastructure/Buildings/MapServer/0",
        format="MapServer",
        geometry_type="Polygon",
    ),
    "railway_lines": PortalDataset(
        id="railway_lines",
        name="Railway Lines",
        description="Railway lines and stations",
        category=DatasetCategory.INFRASTRUCTURE,
        url=f"{EGIS_MAP_SERVICE}/233/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Line",
    ),
    "railway_stations": PortalDataset(
        id="railway_stations",
        name="Rail Station",
        description="Railway station locations",
        category=DatasetCategory.INFRASTRUCTURE,
        url=f"{EGIS_MAP_SERVICE}/235/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Point",
    ),
    # ============ ENVIRONMENT ============
    "wetlands": PortalDataset(
        id="wetlands",
        name="Wetlands",
        description="Protected wetland areas",
        category=DatasetCategory.ENVIRONMENT,
        url=f"{EGIS_MAP_SERVICE}/70/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    "biodiversity_network": PortalDataset(
        id="biodiversity_network",
        name="Biodiversity Network",
        description="Biodiversity corridors and protected areas",
        category=DatasetCategory.ENVIRONMENT,
        url=f"{EGIS_MAP_SERVICE}/133/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    "protected_areas": PortalDataset(
        id="protected_areas",
        name="Protected Areas",
        description="National and provincial protected areas",
        category=DatasetCategory.ENVIRONMENT,
        url=f"{EGIS_MAP_SERVICE}/24/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    "flood_zones": PortalDataset(
        id="flood_zones",
        name="Stormwater Waterbodies",
        description="Areas prone to flooding",
        category=DatasetCategory.ENVIRONMENT,
        url=f"{EGIS_MAP_SERVICE}/71/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    # ============ PLANNING ============
    "zoning": PortalDataset(
        id="zoning",
        name="Zoning",
        description="Land use zoning designations",
        category=DatasetCategory.PLANNING,
        url=f"{EGIS_MAP_SERVICE}/58/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    "development_applications": PortalDataset(
        id="development_applications",
        name="Development Applications",
        description="Current development applications",
        category=DatasetCategory.PLANNING,
        url=f"{EGIS_MAP_SERVICE}/25/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Point",
    ),
    "urban_edge": PortalDataset(
        id="urban_edge",
        name="Urban Edge",
        description="Urban development boundary",
        category=DatasetCategory.PLANNING,
        url=f"{EGIS_MAP_SERVICE}/26/query?where=1%3D1&outFields=*&f=geojson",
        format="MapServer",
        geometry_type="Polygon",
    ),
    # ============ TRANSPORT ============
    "myciti_routes": PortalDataset(
        id="myciti_routes",
        name="MyCiTi Bus Routes",
        description="MyCiTi integrated rapid transit routes",
        category=DatasetCategory.TRANSPORT,
        url=f"{EGIS_MAP_SERVICE}/95/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Line",
    ),
    "myciti_stops": PortalDataset(
        id="myciti_stops",
        name="MyCiTi Bus Stops",
        description="MyCiTi bus stop locations",
        category=DatasetCategory.TRANSPORT,
        url=f"{EGIS_MAP_SERVICE}/96/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    "taxi_ranks": PortalDataset(
        id="taxi_ranks",
        name="Taxi Routes",
        description="Licensed taxi rank locations",
        category=DatasetCategory.TRANSPORT,
        url=f"{EGIS_MAP_SERVICE}/97/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    # ============ SERVICES ============
    "health_facilities": PortalDataset(
        id="health_facilities",
        name="Health Care Facilities",
        description="Hospitals, clinics, and health centers",
        category=DatasetCategory.SERVICES,
        url=f"{EGIS_MAP_SERVICE}/44/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    "schools": PortalDataset(
        id="schools",
        name="Schools",
        description="Primary and secondary schools",
        category=DatasetCategory.SERVICES,
        url=f"{EGIS_MAP_SERVICE}/26/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    "libraries": PortalDataset(
        id="libraries",
        name="Libraries",
        description="Public library locations",
        category=DatasetCategory.SERVICES,
        url=f"{EGIS_MAP_SERVICE}/22/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    "water_facilities": PortalDataset(
        id="water_facilities",
        name="Water Facilities",
        description="Public water access points (Smart Facilities)",
        category=DatasetCategory.SERVICES,
        url=f"{EGIS_MAP_SERVICE}/178/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    # ============ SAFETY ============
    "police_stations": PortalDataset(
        id="police_stations",
        name="Police Stations",
        description="South African Police Service stations",
        category=DatasetCategory.SAFETY,
        url=f"{EGIS_MAP_SERVICE}/82/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    "fire_stations": PortalDataset(
        id="fire_stations",
        name="Fire Stations",
        description="Fire and rescue service stations",
        category=DatasetCategory.SAFETY,
        url=f"{EGIS_MAP_SERVICE}/81/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    "crime_precincts": PortalDataset(
        id="crime_precincts",
        name="Crime Precincts",
        description="Police precinct boundaries for crime statistics",
        category=DatasetCategory.SAFETY,
        url=f"{EGIS_MAP_SERVICE}/31/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Polygon",
    ),
    # ============ UTILITIES ============
    "water_points": PortalDataset(
        id="water_points",
        name="Smart Facilities Water",
        description="Public water access points and fountains",
        category=DatasetCategory.SERVICES,
        url=f"{EGIS_MAP_SERVICE}/178/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    "sanitation_facilities": PortalDataset(
        id="sanitation_facilities",
        name="Sanitation Facilities",
        description="Public toilet and sanitation facilities",
        category=DatasetCategory.SERVICES,
        url=f"{EGIS_MAP_SERVICE}/32/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
    "waste_collection_zones": PortalDataset(
        id="waste_collection_zones",
        name="Refuse Collection Beats",
        description="Waste collection service areas",
        category=DatasetCategory.SERVICES,
        url=f"{EGIS_MAP_SERVICE}/136/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Polygon",
    ),
    "recycling_facilities": PortalDataset(
        id="recycling_facilities",
        name="Think Twice Areas - Recycling",
        description="Recycling drop-off points and facilities",
        category=DatasetCategory.SERVICES,
        url=f"{EGIS_MAP_SERVICE}/101/query?where=1%3D1&outFields=*&f=geojson",
        format="FeatureServer",
        geometry_type="Point",
    ),
}


class PortalClient:
    """Client for interacting with Cape Town Open Data Portal"""

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CapeGeoHub/1.0',
            'Accept': 'application/json'
        })

    def search_datasets(
        self,
        query: Optional[str] = None,
        category: Optional[DatasetCategory] = None,
        geometry_type: Optional[str] = None
    ) -> List[PortalDataset]:
        """
        Search available datasets with optional filters

        Args:
            query: Text search in name/description
            category: Filter by category
            geometry_type: Filter by geometry type (Point, Polygon, Line, Raster)

        Returns:
            List of matching PortalDataset objects
        """
        results = list(PORTAL_DATASETS.values())

        if category:
            results = [d for d in results if d.category == category]

        if geometry_type:
            results = [d for d in results if d.geometry_type.lower() == geometry_type.lower()]

        if query:
            query_lower = query.lower()
            results = [
                d for d in results
                if query_lower in d.name.lower() or query_lower in d.description.lower()
            ]

        return results

    def get_dataset(self, dataset_id: str) -> Optional[PortalDataset]:
        """Get dataset metadata by ID, handling -layer suffix and snake_case conversion"""
        # Direct match
        if dataset_id in PORTAL_DATASETS:
            return PORTAL_DATASETS[dataset_id]

        # Strip -layer suffix and convert hyphens to underscores
        # e.g., 'myciti-stops-layer' -> 'myciti_stops'
        normalized = dataset_id.replace("-layer", "").replace("-", "_")

        return PORTAL_DATASETS.get(normalized)

    def fetch_geojson(self, dataset_id: str, bbox: Optional[List[float]] = None) -> Optional[Dict]:
        """
        Fetch GeoJSON data for a dataset

        Args:
            dataset_id: Dataset identifier
            bbox: Optional bounding box [minLon, minLat, maxLon, maxLat]

        Returns:
            GeoJSON FeatureCollection or None
        """
        dataset = self.get_dataset(dataset_id)
        if not dataset:
            logger.error(f"Dataset not found: {dataset_id}")
            return None

        try:
            if dataset.format == "GeoJSON":
                return self._fetch_geojson_direct(dataset.url, bbox)
            elif dataset.format == "FeatureServer":
                return self._fetch_from_feature_server(dataset.url, bbox)
            elif dataset.format == "MapServer":
                # If the dataset URL already includes a query that returns GeoJSON, try it.
                if '/query' in dataset.url or 'f=geojson' in dataset.url:
                    return self._fetch_from_feature_server(dataset.url, bbox)
                logger.warning(f"MapServer layers cannot be fetched as GeoJSON: {dataset_id}")
                return None
            else:
                logger.error(f"Unsupported format: {dataset.format}")
                return None
        except Exception as e:
            logger.error(f"Error fetching dataset {dataset_id}: {e}")
            return None

    def _fetch_geojson_direct(self, url: str, bbox: Optional[List[float]] = None) -> Optional[Dict]:
        """Fetch GeoJSON directly from URL"""
        try:
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching GeoJSON from {url}: {e}")
            return None

    def _fetch_from_feature_server(self, url: str, bbox: Optional[List[float]] = None) -> Optional[Dict]:
        """Fetch GeoJSON from ArcGIS FeatureServer"""
        # Check if URL already contains query parameters (pre-constructed query URL)
        if '/query?' in url or '/query%3F' in url:
            # URL already has query params, just fetch directly
            try:
                response = self.session.get(url, timeout=self.timeout)
                response.raise_for_status()
                data = response.json()
                # Handle ArcGIS error responses
                if 'error' in data:
                    logger.error(f"ArcGIS error from {url}: {data['error']}")
                    return None
                return data
            except Exception as e:
                logger.error(f"Error fetching from FeatureServer {url}: {e}")
                return None

        # Build query params for base FeatureServer URL
        params = {
            'where': '1=1',
            'outFields': '*',
            'f': 'geojson',
            'returnGeometry': 'true'
        }

        if bbox:
            params['geometry'] = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
            params['geometryType'] = 'esriGeometryEnvelope'
            params['spatialRel'] = 'esriSpatialRelIntersects'

        query_url = f"{url}/query"

        try:
            response = self.session.get(query_url, params=params, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            if 'error' in data:
                logger.error(f"ArcGIS error from {query_url}: {data['error']}")
                return None
            return data
        except Exception as e:
            logger.error(f"Error fetching from FeatureServer {url}: {e}")
            return None

    def get_layer_metadata(self, dataset_id: str) -> Optional[Dict]:
        """Get detailed metadata for a layer"""
        dataset = self.get_dataset(dataset_id)
        if not dataset:
            return None

        try:
            if dataset.format in ["FeatureServer", "MapServer"]:
                response = self.session.get(f"{dataset.url}?f=json", timeout=self.timeout)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching metadata for {dataset_id}: {e}")

        return {
            "id": dataset.id,
            "name": dataset.name,
            "description": dataset.description,
            "geometryType": dataset.geometry_type,
            "attribution": dataset.attribution
        }

    def get_available_categories(self) -> List[Dict[str, Any]]:
        """Get list of available dataset categories with counts"""
        categories = {}
        for dataset in PORTAL_DATASETS.values():
            cat_name = dataset.category.value
            if cat_name not in categories:
                categories[cat_name] = {
                    "name": cat_name,
                    "displayName": cat_name.replace("_", " ").title(),
                    "count": 0,
                    "datasets": []
                }
            categories[cat_name]["count"] += 1
            categories[cat_name]["datasets"].append(dataset.id)

        return list(categories.values())


# Singleton instance
portal_client = PortalClient()


def get_portal_client() -> PortalClient:
    """Get the portal client singleton"""
    return portal_client
