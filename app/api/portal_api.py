"""
Portal API - Endpoints for accessing Cape Town Open Data Portal datasets

Provides REST API for:
- Discovering available datasets
- Fetching GeoJSON data
- Layer metadata
- Spatial queries
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum

from app.core.portal_client import (
    portal_client,
    PortalDataset,
    DatasetCategory,
    PORTAL_DATASETS
)

router = APIRouter(prefix="/portal", tags=["Open Data Portal"])


class DatasetResponse(BaseModel):
    """Response model for dataset info"""
    id: str
    name: str
    description: str
    category: str
    url: str
    format: str
    geometry_type: str
    attribution: str


class CategoryResponse(BaseModel):
    """Response model for category info"""
    name: str
    displayName: str
    count: int
    datasets: List[str]


class DatasetListResponse(BaseModel):
    """Response model for dataset list"""
    total: int
    datasets: List[DatasetResponse]


@router.get("/datasets", response_model=DatasetListResponse)
async def list_datasets(
    category: Optional[str] = Query(None, description="Filter by category"),
    geometry_type: Optional[str] = Query(None, description="Filter by geometry type"),
    search: Optional[str] = Query(None, description="Search in name/description")
):
    """
    List all available datasets from Cape Town Open Data Portal

    Filterable by category, geometry type, and text search.
    """
    # Convert category string to enum if provided
    cat_enum = None
    if category:
        try:
            cat_enum = DatasetCategory(category.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

    datasets = portal_client.search_datasets(
        query=search,
        category=cat_enum,
        geometry_type=geometry_type
    )

    return DatasetListResponse(
        total=len(datasets),
        datasets=[
            DatasetResponse(
                id=d.id,
                name=d.name,
                description=d.description,
                category=d.category.value,
                url=d.url,
                format=d.format,
                geometry_type=d.geometry_type,
                attribution=d.attribution
            )
            for d in datasets
        ]
    )


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories():
    """Get all available dataset categories with counts"""
    return portal_client.get_available_categories()


@router.get("/datasets/{dataset_id}")
async def get_dataset_info(dataset_id: str):
    """Get detailed information about a specific dataset"""
    dataset = portal_client.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset_id}")

    metadata = portal_client.get_layer_metadata(dataset_id)

    return {
        "id": dataset.id,
        "name": dataset.name,
        "description": dataset.description,
        "category": dataset.category.value,
        "url": dataset.url,
        "format": dataset.format,
        "geometry_type": dataset.geometry_type,
        "attribution": dataset.attribution,
        "metadata": metadata
    }


@router.get("/datasets/{dataset_id}/geojson")
async def get_dataset_geojson(
    dataset_id: str,
    bbox: Optional[str] = Query(None, description="Bounding box: minLon,minLat,maxLon,maxLat"),
    simplify: Optional[float] = Query(None, description="Simplification tolerance")
):
    """
    Fetch GeoJSON data for a dataset

    Supports optional bounding box filter for spatial queries.
    """
    dataset = portal_client.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset_id}")

    # MapServer layers are usually tiles/raster and not exportable as GeoJSON.
    # However, some curated entries already contain a pre-built query URL returning GeoJSON
    # (e.g., .../query?where=1%3D1&outFields=*&f=geojson). Allow those through.
    if dataset.format == "MapServer" and ('/query' not in dataset.url and 'f=geojson' not in dataset.url):
        raise HTTPException(
            status_code=400,
            detail="MapServer raster layers cannot be exported as GeoJSON. Use the tile URL instead."
        )

    # Parse bounding box
    bbox_list = None
    if bbox:
        try:
            bbox_list = [float(x) for x in bbox.split(",")]
            if len(bbox_list) != 4:
                raise ValueError("Invalid bbox format")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bbox format. Use: minLon,minLat,maxLon,maxLat")

    geojson = portal_client.fetch_geojson(dataset_id, bbox=bbox_list)

    if not geojson:
        raise HTTPException(status_code=502, detail="Failed to fetch data from source")

    return {
        "dataset": {
            "id": dataset.id,
            "name": dataset.name,
            "attribution": dataset.attribution
        },
        "geojson": geojson,
        "metadata": {
            "feature_count": len(geojson.get("features", [])),
            "bbox": bbox,
            "source": dataset.url
        }
    }


@router.get("/tiles/{dataset_id}")
async def get_tile_url(dataset_id: str):
    """
    Get tile URL for MapServer/imagery layers

    Returns the URL template for use in web mapping applications.
    """
    dataset = portal_client.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset_id}")

    if dataset.format != "MapServer":
        raise HTTPException(
            status_code=400,
            detail="This endpoint is only for MapServer layers. Use /geojson for vector data."
        )

    # ArcGIS MapServer tile URL template
    tile_url = f"{dataset.url}/tile/{{z}}/{{y}}/{{x}}"

    return {
        "dataset_id": dataset.id,
        "name": dataset.name,
        "tile_url": tile_url,
        "attribution": dataset.attribution,
        "usage": {
            "leaflet": f'L.tileLayer("{tile_url}", {{attribution: "{dataset.attribution}"}})',
            "mapbox": {
                "type": "raster",
                "tiles": [tile_url],
                "attribution": dataset.attribution
            }
        }
    }


# Layer styling presets for different dataset types
LAYER_STYLES = {
    "zoning": {
        "fill_colors": {
            "Residential": "#ffeda0",
            "Commercial": "#feb24c",
            "Industrial": "#fc4e2a",
            "Mixed Use": "#bd0026",
            "Open Space": "#31a354",
            "Agricultural": "#addd8e",
            "default": "#969696"
        },
        "stroke_color": "#333333",
        "stroke_width": 1,
        "fill_opacity": 0.6
    },
    "biodiversity_network": {
        "fill_colors": {
            "Critical": "#006d2c",
            "Important": "#31a354",
            "Buffer": "#a1d99b",
            "default": "#74c476"
        },
        "stroke_color": "#005a32",
        "stroke_width": 1,
        "fill_opacity": 0.5
    },
    "flood_zones": {
        "fill_colors": {
            "High": "#08519c",
            "Medium": "#3182bd",
            "Low": "#6baed6",
            "default": "#9ecae1"
        },
        "stroke_color": "#08306b",
        "stroke_width": 1,
        "fill_opacity": 0.4
    },
    "development_focus_areas": {
        "fill_color": "#e31a1c",
        "stroke_color": "#bd0026",
        "stroke_width": 2,
        "fill_opacity": 0.3
    },
    "protected_areas": {
        "fill_color": "#238b45",
        "stroke_color": "#006d2c",
        "stroke_width": 2,
        "fill_opacity": 0.4
    },
    "wetlands": {
        "fill_color": "#2b8cbe",
        "stroke_color": "#0868ac",
        "stroke_width": 1,
        "fill_opacity": 0.5
    },
    "informal_settlements": {
        "fill_color": "#fd8d3c",
        "stroke_color": "#e6550d",
        "stroke_width": 1,
        "fill_opacity": 0.6
    }
}


@router.get("/styles/{dataset_id}")
async def get_layer_style(dataset_id: str):
    """
    Get recommended styling for a dataset

    Returns color schemes, opacity, and styling rules for visualization.
    """
    dataset = portal_client.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset_id}")

    style = LAYER_STYLES.get(dataset_id, {
        "fill_color": "#3388ff",
        "stroke_color": "#2266cc",
        "stroke_width": 1,
        "fill_opacity": 0.5
    })

    return {
        "dataset_id": dataset_id,
        "name": dataset.name,
        "geometry_type": dataset.geometry_type,
        "style": style,
        "popup_fields": _get_popup_fields(dataset_id)
    }


def _get_popup_fields(dataset_id: str) -> List[dict]:
    """Get recommended popup fields for a dataset"""
    popup_configs = {
        "zoning": [
            {"field": "ZONE_CODE", "label": "Zone Code"},
            {"field": "ZONE_DESC", "label": "Description"},
            {"field": "SCHEME", "label": "Scheme"}
        ],
        "suburbs": [
            {"field": "OFC_SBRB_NAME", "label": "Suburb Name"},
            {"field": "AREA_HA", "label": "Area (ha)"}
        ],
        "biodiversity_network": [
            {"field": "BIO_CLASS", "label": "Classification"},
            {"field": "ECO_STATUS", "label": "Ecological Status"},
            {"field": "AREA_HA", "label": "Area (ha)"}
        ],
        "flood_zones": [
            {"field": "FLOOD_RISK", "label": "Risk Level"},
            {"field": "RETURN_PERIOD", "label": "Return Period"}
        ],
        "development_focus_areas": [
            {"field": "AREA_NAME", "label": "Area Name"},
            {"field": "DEV_TYPE", "label": "Development Type"},
            {"field": "STATUS", "label": "Status"}
        ],
        "myciti_stops": [
            {"field": "STOP_NAME", "label": "Stop Name"},
            {"field": "ROUTE_IDS", "label": "Routes"},
            {"field": "STATUS", "label": "Status"}
        ]
    }

    return popup_configs.get(dataset_id, [{"field": "*", "label": "Properties"}])
