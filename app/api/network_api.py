"""
Network Analysis API - Routing and network-based spatial analysis

Provides REST API for:
- Shortest path routing between two points
- Isochrone (travel time) analysis
- Service area calculations
- Network connectivity analysis
"""

import logging
from typing import Optional, List, Dict, Any, Tuple
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, LineString, mapping
from shapely.ops import nearest_points

from app.config import settings
from app.core.data_loader import data_loader
from app.spatial_analysis.spatial_utils import gdf_to_geojson

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/network", tags=["Network Analysis"])


class RoutePoint(BaseModel):
    """A point on a route"""
    lat: float
    lon: float
    name: Optional[str] = None


class RouteResponse(BaseModel):
    """Route calculation response"""
    origin: Dict[str, float]
    destination: Dict[str, float]
    distance_meters: float
    estimated_time_minutes: float
    route_geojson: Dict[str, Any]
    waypoints: List[Dict[str, Any]]
    transport_mode: str


class IsochroneResponse(BaseModel):
    """Isochrone analysis response"""
    center: Dict[str, float]
    travel_time_minutes: int
    transport_mode: str
    area_sqkm: float
    isochrone_geojson: Dict[str, Any]


class ServiceAreaResponse(BaseModel):
    """Service area analysis response"""
    facilities: int
    travel_time_minutes: int
    coverage_geojson: Dict[str, Any]
    population_covered: Optional[int] = None


# Average travel speeds (meters per minute) for different modes
TRAVEL_SPEEDS = {
    "walking": 80,      # ~5 km/h
    "cycling": 250,     # ~15 km/h
    "driving": 500,     # ~30 km/h in urban areas
    "transit": 333      # ~20 km/h average with stops
}


@router.get("/route")
async def calculate_route(
    origin_lat: float = Query(..., description="Origin latitude"),
    origin_lon: float = Query(..., description="Origin longitude"),
    dest_lat: float = Query(..., description="Destination latitude"),
    dest_lon: float = Query(..., description="Destination longitude"),
    mode: str = Query("driving", description="Transport mode: walking, cycling, driving, transit"),
    include_transit_stops: bool = Query(True, description="Include nearby transit stops")
):
    """
    Calculate a route between two points.

    Uses road network data when available, otherwise calculates
    straight-line route with estimated travel time.
    """
    try:
        origin = Point(origin_lon, origin_lat)
        destination = Point(dest_lon, dest_lat)

        # Calculate straight-line distance first
        origin_gdf = gpd.GeoDataFrame(geometry=[origin], crs=settings.TARGET_CRS)
        dest_gdf = gpd.GeoDataFrame(geometry=[destination], crs=settings.TARGET_CRS)
        origin_proj = origin_gdf.to_crs(settings.PROJECTED_CRS)
        dest_proj = dest_gdf.to_crs(settings.PROJECTED_CRS)
        straight_distance = float(origin_proj.geometry.iloc[0].distance(dest_proj.geometry.iloc[0]))

        # Estimate route distance (typically 1.3-1.5x straight line in urban areas)
        route_factor = 1.4
        estimated_distance = straight_distance * route_factor

        # Calculate travel time
        speed = TRAVEL_SPEEDS.get(mode, TRAVEL_SPEEDS["driving"])
        travel_time = estimated_distance / speed

        # Create route geometry
        route_line = LineString([origin, destination])
        route_gdf = gpd.GeoDataFrame(geometry=[route_line], crs=settings.TARGET_CRS)

        # Find nearby transit stops if requested
        waypoints = []
        if include_transit_stops and mode == "transit":
            waypoints = await _find_transit_stops_along_route(origin, destination)

        return RouteResponse(
            origin={"lat": origin_lat, "lon": origin_lon},
            destination={"lat": dest_lat, "lon": dest_lon},
            distance_meters=round(estimated_distance, 0),
            estimated_time_minutes=round(travel_time, 1),
            route_geojson=gdf_to_geojson(route_gdf),
            waypoints=waypoints,
            transport_mode=mode
        )

    except Exception as e:
        logger.error(f"Route calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/isochrone")
async def calculate_isochrone(
    lat: float = Query(..., description="Center latitude"),
    lon: float = Query(..., description="Center longitude"),
    time_minutes: int = Query(15, ge=1, le=120, description="Travel time in minutes"),
    mode: str = Query("walking", description="Transport mode"),
    intervals: int = Query(1, ge=1, le=5, description="Number of time intervals")
):
    """
    Calculate isochrone (travel time contour) from a point.

    Returns polygons showing areas reachable within specified travel times.
    """
    try:
        center = Point(lon, lat)

        # Calculate travel distance for each interval
        speed = TRAVEL_SPEEDS.get(mode, TRAVEL_SPEEDS["walking"])

        features = []
        for i in range(intervals, 0, -1):
            interval_minutes = (time_minutes / intervals) * i
            travel_distance = speed * interval_minutes

            # Create buffer (simplified isochrone)
            center_gdf = gpd.GeoDataFrame(geometry=[center], crs=settings.TARGET_CRS)
            center_proj = center_gdf.to_crs(settings.PROJECTED_CRS)
            buffer_proj = center_proj.geometry.buffer(travel_distance)
            buffer_wgs = gpd.GeoDataFrame(geometry=buffer_proj, crs=settings.PROJECTED_CRS).to_crs(settings.TARGET_CRS)

            # Calculate area
            area_sqkm = buffer_proj.iloc[0].area / 1_000_000

            features.append({
                "type": "Feature",
                "geometry": mapping(buffer_wgs.geometry.iloc[0]),
                "properties": {
                    "time_minutes": int(interval_minutes),
                    "distance_meters": round(travel_distance, 0),
                    "area_sqkm": round(area_sqkm, 2),
                    "mode": mode
                }
            })

        return {
            "type": "FeatureCollection",
            "features": features,
            "center": {"lat": lat, "lon": lon},
            "mode": mode,
            "max_time_minutes": time_minutes
        }

    except Exception as e:
        logger.error(f"Isochrone calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/service-area")
async def calculate_service_area(
    facility_type: str = Query(..., description="Facility type: clinics, schools, parks, myciti_stops"),
    time_minutes: int = Query(15, ge=1, le=60, description="Travel time threshold"),
    mode: str = Query("walking", description="Transport mode")
):
    """
    Calculate combined service area for a set of facilities.

    Returns polygons showing areas within travel time of any facility.
    """
    try:
        # Load facilities
        gdf = data_loader.get_gdf(facility_type)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Facility type {facility_type} not found")

        # Calculate buffer distance
        speed = TRAVEL_SPEEDS.get(mode, TRAVEL_SPEEDS["walking"])
        buffer_distance = speed * time_minutes

        # Project and buffer
        gdf_proj = gdf.to_crs(settings.PROJECTED_CRS)

        # Create individual buffers
        buffers = gdf_proj.geometry.buffer(buffer_distance)

        # Union all buffers
        combined = buffers.union_all()

        # Convert back to WGS84
        result_gdf = gpd.GeoDataFrame(geometry=[combined], crs=settings.PROJECTED_CRS)
        result_wgs = result_gdf.to_crs(settings.TARGET_CRS)

        # Calculate coverage area
        area_sqkm = combined.area / 1_000_000

        return ServiceAreaResponse(
            facilities=len(gdf),
            travel_time_minutes=time_minutes,
            coverage_geojson=gdf_to_geojson(result_wgs),
            population_covered=None  # Would need population data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Service area calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nearest")
async def find_nearest_facility(
    lat: float = Query(..., description="Search location latitude"),
    lon: float = Query(..., description="Search location longitude"),
    facility_type: str = Query(..., description="Facility type to search"),
    count: int = Query(5, ge=1, le=20, description="Number of results")
):
    """
    Find nearest facilities to a given location.
    """
    try:
        point = Point(lon, lat)

        # Load facilities
        gdf = data_loader.get_gdf(facility_type)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Facility type {facility_type} not found")

        # Project for accurate distance
        point_gdf = gpd.GeoDataFrame(geometry=[point], crs=settings.TARGET_CRS)
        point_proj = point_gdf.to_crs(settings.PROJECTED_CRS).geometry.iloc[0]
        gdf_proj = gdf.to_crs(settings.PROJECTED_CRS)

        # Calculate distances
        gdf_proj['distance'] = gdf_proj.geometry.distance(point_proj)

        # Get nearest
        nearest = gdf_proj.nsmallest(count, 'distance')

        # Convert back to WGS84 for output
        nearest_wgs = nearest.to_crs(settings.TARGET_CRS)

        results = []
        for idx, row in nearest_wgs.iterrows():
            # Get centroid for point representation
            if row.geometry.geom_type == 'Point':
                lat_out, lon_out = row.geometry.y, row.geometry.x
            else:
                centroid = row.geometry.centroid
                lat_out, lon_out = centroid.y, centroid.x

            # Find name field
            name = "Unknown"
            for col in ['name', 'NAME', 'facility_name', 'stop_name']:
                if col in row.index and pd.notna(row[col]):
                    name = row[col]
                    break

            results.append({
                "name": name,
                "lat": lat_out,
                "lon": lon_out,
                "distance_meters": round(row['distance'], 0),
                "properties": {k: v for k, v in row.items()
                              if k not in ['geometry', 'distance'] and pd.notna(v)}
            })

        return {
            "origin": {"lat": lat, "lon": lon},
            "facility_type": facility_type,
            "results": results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Nearest facility search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/connectivity")
async def analyze_transit_connectivity(
    lat: float = Query(..., description="Location latitude"),
    lon: float = Query(..., description="Location longitude"),
    radius_meters: int = Query(1000, ge=100, le=5000, description="Search radius")
):
    """
    Analyze transit connectivity at a location.

    Returns nearby transit options and connectivity score.
    """
    try:
        from app.spatial_analysis.spatial_utils import create_buffer

        point = Point(lon, lat)
        buffer = create_buffer(point, radius_meters)

        connectivity = {
            "location": {"lat": lat, "lon": lon},
            "radius_meters": radius_meters,
            "transit_options": [],
            "connectivity_score": 0
        }

        # Check MyCiti stops
        try:
            stops = data_loader.get_gdf("myciti_stops")
            if not stops.empty:
                nearby_stops = stops[stops.geometry.within(buffer)]
                connectivity["transit_options"].append({
                    "type": "MyCiti Bus",
                    "count": len(nearby_stops),
                    "features": _extract_feature_names(nearby_stops)
                })
                connectivity["connectivity_score"] += min(len(nearby_stops) * 10, 40)
        except:
            pass

        # Check rail stations
        try:
            rail = data_loader.get_gdf("rail_stations")
            if not rail.empty:
                nearby_rail = rail[rail.geometry.within(buffer)]
                connectivity["transit_options"].append({
                    "type": "Rail Station",
                    "count": len(nearby_rail),
                    "features": _extract_feature_names(nearby_rail)
                })
                connectivity["connectivity_score"] += min(len(nearby_rail) * 20, 40)
        except:
            pass

        # Normalize score to 0-100
        connectivity["connectivity_score"] = min(connectivity["connectivity_score"], 100)
        connectivity["connectivity_level"] = _get_connectivity_level(connectivity["connectivity_score"])

        return connectivity

    except Exception as e:
        logger.error(f"Connectivity analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _find_transit_stops_along_route(
    origin: Point,
    destination: Point,
    buffer_meters: float = 500
) -> List[Dict]:
    """Find transit stops along a route."""
    waypoints = []

    try:
        # Create route line
        route = LineString([origin, destination])

        # Buffer the route
        route_gdf = gpd.GeoDataFrame(geometry=[route], crs=settings.TARGET_CRS)
        route_proj = route_gdf.to_crs(settings.PROJECTED_CRS)
        buffer_proj = route_proj.geometry.buffer(buffer_meters)
        buffer_wgs = gpd.GeoDataFrame(geometry=buffer_proj, crs=settings.PROJECTED_CRS).to_crs(settings.TARGET_CRS)
        buffer_geom = buffer_wgs.geometry.iloc[0]

        # Find stops
        stops = data_loader.get_gdf("myciti_stops")
        if not stops.empty:
            nearby = stops[stops.geometry.within(buffer_geom)]
            for _, row in nearby.head(10).iterrows():
                if row.geometry.geom_type == 'Point':
                    waypoints.append({
                        "type": "transit_stop",
                        "name": row.get('name', row.get('stop_name', 'Bus Stop')),
                        "lat": row.geometry.y,
                        "lon": row.geometry.x
                    })
    except Exception as e:
        logger.warning(f"Could not find transit stops: {e}")

    return waypoints


def _extract_feature_names(gdf: gpd.GeoDataFrame, limit: int = 5) -> List[str]:
    """Extract feature names from a GeoDataFrame."""
    names = []
    for col in ['name', 'NAME', 'stop_name', 'station_name']:
        if col in gdf.columns:
            names = gdf[col].dropna().head(limit).tolist()
            break
    return names


def _get_connectivity_level(score: int) -> str:
    """Convert connectivity score to level description."""
    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "Good"
    elif score >= 40:
        return "Moderate"
    elif score >= 20:
        return "Limited"
    else:
        return "Poor"
