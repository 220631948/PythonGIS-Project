import geopandas as gpd
import json
from shapely.geometry import Point, Polygon, LineString, mapping
from typing import List, Union, Dict, Any
from app.config import settings

def point_in_polygon(point: Point, polygon: Polygon) -> bool:
    return polygon.contains(point)


def gdf_to_geojson(gdf: gpd.GeoDataFrame) -> Dict[str, Any]:
    """
    Safely convert GeoDataFrame to GeoJSON dict.
    Works around numpy 2.0 compatibility issues with geopandas.
    """
    features = []
    for idx, row in gdf.iterrows():
        geom = row.geometry
        properties = {}
        for col in gdf.columns:
            if col != 'geometry':
                val = row[col]
                # Handle numpy types
                if hasattr(val, 'item'):
                    try:
                        val = val.item()
                    except (ValueError, AttributeError):
                        val = str(val)
                # Handle NaN
                if isinstance(val, float) and (val != val):  # NaN check
                    val = None
                properties[col] = val

        feature = {
            "type": "Feature",
            "id": str(idx),
            "properties": properties,
            "geometry": mapping(geom) if geom is not None else None
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }


def gdf_to_geojson_str(gdf: gpd.GeoDataFrame) -> str:
    """Convert GeoDataFrame to GeoJSON string."""
    return json.dumps(gdf_to_geojson(gdf))

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
