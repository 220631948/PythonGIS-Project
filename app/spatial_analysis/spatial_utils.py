import geopandas as gpd
import json
from shapely.geometry import Point, Polygon, LineString, mapping
from shapely.ops import transform
import pyproj
from typing import List, Union, Dict, Any
from app.config import settings

# Initialize transformers for common spatial operations to avoid GeoDataFrame overhead
# Optimized for WGS84 (EPSG:4326) <-> Cape Town UTM (EPSG:32734)
_project_transformer = pyproj.Transformer.from_crs(
    settings.TARGET_CRS, settings.PROJECTED_CRS, always_xy=True
).transform

_unproject_transformer = pyproj.Transformer.from_crs(
    settings.PROJECTED_CRS, settings.TARGET_CRS, always_xy=True
).transform


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
    # Optimization: Use pyproj directly for standard CRS to avoid GeoDataFrame overhead
    # This is ~10x faster for single geometries
    if crs == settings.TARGET_CRS:
        try:
            # Transform to projected CRS
            projected_geom = transform(_project_transformer, geometry)
            # Buffer in projected units (meters)
            buffered_geom = projected_geom.buffer(distance_meters)
            # Transform back to original CRS
            return transform(_unproject_transformer, buffered_geom)
        except Exception:
            # Fallback to slower method if transformation fails
            pass

    # Convert to projected CRS for accurate buffering in meters
    gdf = gpd.GeoDataFrame(geometry=[geometry], crs=crs)
    gdf_proj = gdf.to_crs(settings.PROJECTED_CRS)
    gdf_proj.geometry = gdf_proj.geometry.buffer(distance_meters)
    return gdf_proj.to_crs(crs).geometry.iloc[0]


def calculate_distance(p1: Point, p2: Point, crs: str = settings.TARGET_CRS) -> float:
    """Calculates distance between two points in meters."""
    # Optimization: Use pyproj directly for standard CRS to avoid GeoDataFrame overhead
    # This is ~20x faster for single point-to-point calculations
    if crs == settings.TARGET_CRS:
        try:
            p1_proj = transform(_project_transformer, p1)
            p2_proj = transform(_project_transformer, p2)
            return p1_proj.distance(p2_proj)
        except Exception:
            # Fallback to slower method if transformation fails
            pass

    gdf = gpd.GeoDataFrame(geometry=[p1, p2], crs=crs)
    gdf_proj = gdf.to_crs(settings.PROJECTED_CRS)
    return gdf_proj.geometry.iloc[0].distance(gdf_proj.geometry.iloc[1])

def simplify_geometry(geometry, tolerance: float = settings.SIMPLIFICATION_TOLERANCE):
    return geometry.simplify(tolerance, preserve_topology=True)


def calculate_shadow_geometry(
    geometry: Dict[str, Any], height: float, datetime_str: str
) -> Dict[str, Any]:
    """
    Calculates the shadow polygon for a given geometry at a specific time.
    
    NOTE: This is a simplified simulation for the MVP.
    Real solar azimuth/altitude calculation would require 'pysolar' or similar.
    """
    from shapely.geometry import shape, Polygon, MultiPolygon
    from shapely.affinity import translate
    
    # Parse input geometry
    geom = shape(geometry)
    
    # 1. Simulate sun position based on time (very basic approximation)
    # In a real app, use pysolar.get_altitude(lat, lng, date)
    # Here we just assume a fixed offset to demonstrate the concept
    
    # Shift x/y based on height to simulate shadow casting
    # Higher buildings cast longer shadows
    shift_x = height * 0.5
    shift_y = height * -0.5
    
    # 2. Project the 'top' of the building to the ground
    shadow_offset = translate(geom, xoff=shift_x, yoff=shift_y)
    
    # 3. Create the convex hull of the original footprint + the projected top
    # This represents the total shadow area on the ground
    combined = geom.union(shadow_offset)
    shadow_hull = combined.convex_hull
    
    # Return as GeoJSON
    return mapping(shadow_hull)
