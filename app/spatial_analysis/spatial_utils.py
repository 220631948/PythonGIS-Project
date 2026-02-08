import geopandas as gpd
import json
from shapely.geometry import Point, Polygon, LineString, mapping
from typing import List, Union, Dict, Any
from app.config import settings

def point_in_polygon(point: Point, polygon: Polygon) -> bool:
    return polygon.contains(point)


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    return str(obj)


def gdf_to_geojson_str(gdf: gpd.GeoDataFrame) -> str:
    """Convert GeoDataFrame to GeoJSON string."""
    # Use native geopandas serialization which is much faster (C-optimized)
    # na='null' handles NaNs correctly
    # default=json_serial handles Timestamp and other non-JSON types
    return gdf.to_json(default=json_serial, na="null")


def gdf_to_geojson(gdf: gpd.GeoDataFrame) -> Dict[str, Any]:
    """
    Safely convert GeoDataFrame to GeoJSON dict.
    Uses optimized string serialization and re-parsing for performance.
    """
    if gdf.empty:
        return {"type": "FeatureCollection", "features": []}

    return json.loads(gdf_to_geojson_str(gdf))


def create_buffer(geometry, distance_meters: float, crs: str = settings.TARGET_CRS):
    """Creates a buffer around a geometry, handling projections."""
    # Convert to projected CRS for accurate buffering in meters
    gdf = gpd.GeoDataFrame(geometry=[geometry], crs=crs)
    gdf_proj = gdf.to_crs(settings.PROJECTED_CRS)
    gdf_proj.geometry = gdf_proj.geometry.buffer(distance_meters)
    return gdf_proj.to_crs(crs).geometry.iloc[0]

def calculate_distance(p1: Point, p2: Point, crs: str = settings.TARGET_CRS) -> float:
    """Calculates distance between two points in meters."""
    gdf = gpd.GeoDataFrame(geometry=[p1, p2], crs=crs)
    gdf_proj = gdf.to_crs(settings.PROJECTED_CRS)
    return gdf_proj.geometry.iloc[0].distance(gdf_proj.geometry.iloc[1])

def simplify_geometry(geometry, tolerance: float = settings.SIMPLIFICATION_TOLERANCE):
    return geometry.simplify(tolerance, preserve_topology=True)
