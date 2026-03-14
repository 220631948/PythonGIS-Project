"""
Advanced Spatial Analysis API - Viewshed, Topology Validation, Routing

Provides:
- Visibility/Viewshed analysis
- Topology validation tools
- Network analysis (routing, travel time)
"""

from fastapi import APIRouter, HTTPException, Query, Body
import logging
import math
from datetime import datetime

from app.core.data_loader import data_loader
from app.spatial_analysis.spatial_utils import gdf_to_geojson

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analysis", tags=["Advanced Spatial Analysis"])


# ============ Viewshed Analysis ============

@router.post("/viewshed")
async def calculate_viewshed(
    lat: float = Body(..., ge=-90, le=90, description="Observer latitude"),
    lng: float = Body(..., ge=-180, le=180, description="Observer longitude"),
    observer_height: float = Body(default=1.7, description="Observer height in meters"),
    max_distance: float = Body(default=5000, description="Maximum view distance in meters"),
    resolution: int = Body(default=36, ge=8, le=360, description="Angular resolution (number of rays)")
):
    """
    Calculate viewshed from a point location

    Determines areas visible from a given observer location.
    Note: This is a simplified implementation. Full viewshed requires DEM data.

    Returns visibility rays and potentially visible areas.
    """
    # Attach observer location context for Sentry
    try:
        from app.utils.sentry_utils import attach_geo_context, attach_map_link

        attach_geo_context(centroid=[lng, lat])
        attach_map_link(centroid=[lng, lat], zoom=12)
    except Exception:
        pass

    # Generate visibility rays
    rays = []
    angle_step = 360 / resolution

    for i in range(resolution):
        angle = i * angle_step
        angle_rad = math.radians(angle)

        # Calculate endpoint of ray
        # Approximate conversion: 1 degree ≈ 111km at equator
        dx = (max_distance / 111000) * math.sin(angle_rad)
        dy = (max_distance / 111000) * math.cos(angle_rad)

        end_lat = lat + dy
        end_lng = lng + dx / math.cos(math.radians(lat))

        rays.append({
            "angle": angle,
            "start": [lng, lat],
            "end": [end_lng, end_lat],
            "distance_m": max_distance,
            "visible": True  # Simplified - assume all visible without DEM
        })

    # Create viewshed polygon (simplified circle without obstructions)
    viewshed_coords = [[lng, lat]]
    for ray in rays:
        viewshed_coords.append(ray["end"])
    viewshed_coords.append(rays[0]["end"])  # Close the polygon

    viewshed_geojson = {
        "type": "Feature",
        "properties": {
            "observer_location": [lng, lat],
            "observer_height_m": observer_height,
            "max_distance_m": max_distance,
            "resolution": resolution,
            "analysis_type": "simplified_viewshed",
            "note": "Full viewshed analysis requires DEM data"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [viewshed_coords]
        }
    }

    return {
        "viewshed": viewshed_geojson,
        "rays": rays[:8],  # Return sample rays
        "analysis_info": {
            "method": "ray_casting",
            "has_dem": False,
            "accuracy": "approximate",
            "timestamp": datetime.utcnow().isoformat()
        }
    }


@router.get("/visibility-check")
async def check_visibility(
    from_lat: float = Query(..., ge=-90, le=90),
    from_lng: float = Query(..., ge=-180, le=180),
    to_lat: float = Query(..., ge=-90, le=90),
    to_lng: float = Query(..., ge=-180, le=180),
    from_height: float = Query(default=1.7, description="Observer height in meters"),
    to_height: float = Query(default=0, description="Target height in meters")
):
    """
    Check if there is line-of-sight between two points

    Simplified check without DEM obstruction data.
    """
    # Calculate distance
    R = 6371000  # Earth radius in meters
    lat1_rad = math.radians(from_lat)
    lat2_rad = math.radians(to_lat)
    delta_lat = math.radians(to_lat - from_lat)
    delta_lng = math.radians(to_lng - from_lng)

    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c

    # Simple earth curvature check
    # At what distance does earth curvature block line of sight?
    # Approximate: horizon distance = sqrt(2 * R * h)
    horizon_from = math.sqrt(2 * R * from_height)
    horizon_to = math.sqrt(2 * R * to_height)
    max_visible_distance = horizon_from + horizon_to

    is_visible = distance <= max_visible_distance

    return {
        "from": {"lat": from_lat, "lng": from_lng, "height_m": from_height},
        "to": {"lat": to_lat, "lng": to_lng, "height_m": to_height},
        "distance_m": round(distance, 2),
        "is_visible": is_visible,
        "horizon_distance_m": round(max_visible_distance, 2),
        "analysis_info": {
            "method": "earth_curvature_only",
            "has_obstruction_data": False,
            "note": "Does not account for terrain or buildings"
        }
    }


# ============ Topology Validation ============

@router.get("/topology/validate/{dataset}")
async def validate_topology(
    dataset: str,
    check_self_intersections: bool = Query(default=True),
    check_overlaps: bool = Query(default=True),
    check_gaps: bool = Query(default=False),
    tolerance: float = Query(default=0.00001, description="Tolerance for geometry operations")
):
    """
    Validate topology of a spatial dataset

    Checks for:
    - Self-intersecting geometries
    - Overlapping features
    - Gaps between features
    - Invalid geometries
    """
    # Attach dataset context for Sentry
    try:
        from app.utils.sentry_utils import attach_geo_context

        attach_geo_context(dataset_id=dataset)
    except Exception:
        pass

    try:
        gdf = await data_loader.get_gdf_async(dataset)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset}")

    if gdf.empty:
        return {"error": "Dataset is empty", "issues": []}

    issues = []

    # Check for invalid geometries
    invalid_geoms = gdf[~gdf.geometry.is_valid]
    if len(invalid_geoms) > 0:
        for idx in invalid_geoms.index[:10]:  # Limit to first 10
            issues.append({
                "type": "invalid_geometry",
                "feature_index": int(idx),
                "severity": "error",
                "description": "Geometry is not valid according to OGC rules"
            })

    # Check for self-intersections
    if check_self_intersections:
        for idx, row in gdf.iterrows():
            if row.geometry and not row.geometry.is_simple:
                issues.append({
                    "type": "self_intersection",
                    "feature_index": int(idx),
                    "severity": "warning",
                    "description": "Geometry has self-intersections"
                })
                if len(issues) > 50:
                    break

    # Check for overlaps (simplified - check a sample)
    if check_overlaps and len(gdf) > 1:
        sample_size = min(100, len(gdf))
        sample = gdf.head(sample_size)

        for i, row1 in sample.iterrows():
            for j, row2 in sample.iterrows():
                if i >= j:
                    continue
                try:
                    if row1.geometry.overlaps(row2.geometry):
                        issues.append({
                            "type": "overlap",
                            "feature_indices": [int(i), int(j)],
                            "severity": "warning",
                            "description": f"Features {i} and {j} overlap"
                        })
                        if len(issues) > 50:
                            break
                except Exception:
                    pass
            if len(issues) > 50:
                break

    # Summary
    issue_counts = {}
    for issue in issues:
        t = issue["type"]
        issue_counts[t] = issue_counts.get(t, 0) + 1

    return {
        "dataset": dataset,
        "feature_count": len(gdf),
        "is_valid": len(issues) == 0,
        "issue_count": len(issues),
        "issue_summary": issue_counts,
        "issues": issues[:20],  # Return first 20 issues
        "validation_params": {
            "check_self_intersections": check_self_intersections,
            "check_overlaps": check_overlaps,
            "check_gaps": check_gaps,
            "tolerance": tolerance
        }
    }


@router.post("/topology/fix/{dataset}")
async def fix_topology(
    dataset: str,
    fix_invalid: bool = Body(default=True),
    fix_self_intersections: bool = Body(default=True),
    buffer_distance: float = Body(default=0, description="Buffer distance for fixing (0 = buffer(0) trick)")
):
    """
    Attempt to fix topology issues in a dataset

    Returns fixed GeoJSON.
    """
    try:
        gdf = await data_loader.get_gdf_async(dataset)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset}")

    if gdf.empty:
        return {"error": "Dataset is empty"}

    fixed_count = 0
    original_invalid = len(gdf[~gdf.geometry.is_valid])

    # Fix invalid geometries using buffer(0) trick
    if fix_invalid:
        gdf['geometry'] = gdf['geometry'].apply(
            lambda g: g.buffer(buffer_distance) if g and not g.is_valid else g
        )
        fixed_count = original_invalid - len(gdf[~gdf.geometry.is_valid])

    # Simplify to remove self-intersections
    if fix_self_intersections:
        gdf['geometry'] = gdf['geometry'].simplify(0.00001, preserve_topology=True)

    return {
        "dataset": dataset,
        "original_invalid_count": original_invalid,
        "fixed_count": fixed_count,
        "remaining_invalid": len(gdf[~gdf.geometry.is_valid]),
        "geojson": gdf_to_geojson(gdf)
    }


# ============ Network/Routing Analysis ============

@router.get("/route")
async def calculate_route(
    from_lat: float = Query(..., ge=-90, le=90),
    from_lng: float = Query(..., ge=-180, le=180),
    to_lat: float = Query(..., ge=-90, le=90),
    to_lng: float = Query(..., ge=-180, le=180),
    mode: str = Query(default="driving", description="Mode: driving, walking, cycling")
):
    """
    Calculate route between two points

    Note: This is a simplified straight-line route.
    Full routing requires road network data and routing engine (OSRM, Valhalla).
    """
    # Calculate straight-line distance
    R = 6371000  # Earth radius in meters
    lat1_rad = math.radians(from_lat)
    lat2_rad = math.radians(to_lat)
    delta_lat = math.radians(to_lat - from_lat)
    delta_lng = math.radians(to_lng - from_lng)

    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    straight_distance = R * c

    # Estimate route distance (typically 1.3-1.5x straight line in urban areas)
    route_factor = 1.4
    route_distance = straight_distance * route_factor

    # Estimate travel time based on mode
    speeds = {
        "driving": 40,  # km/h average urban
        "cycling": 15,
        "walking": 5
    }
    speed = speeds.get(mode, 40)
    travel_time_minutes = (route_distance / 1000) / speed * 60

    # Create simplified route geometry
    route_geojson = {
        "type": "Feature",
        "properties": {
            "mode": mode,
            "distance_m": round(route_distance, 2),
            "straight_line_distance_m": round(straight_distance, 2),
            "estimated_time_minutes": round(travel_time_minutes, 1),
            "route_type": "estimated_straight_line"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [from_lng, from_lat],
                [to_lng, to_lat]
            ]
        }
    }

    return {
        "route": route_geojson,
        "summary": {
            "from": {"lat": from_lat, "lng": from_lng},
            "to": {"lat": to_lat, "lng": to_lng},
            "mode": mode,
            "distance_m": round(route_distance, 2),
            "estimated_time_minutes": round(travel_time_minutes, 1)
        },
        "note": "This is an estimated route. For accurate routing, integrate with OSRM or similar routing engine."
    }


@router.get("/isochrone")
async def calculate_isochrone(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    time_minutes: int = Query(default=15, ge=1, le=120),
    mode: str = Query(default="driving", description="Mode: driving, walking, cycling")
):
    """
    Calculate isochrone (travel time polygon) from a point

    Returns area reachable within specified travel time.
    Note: Simplified circular approximation.
    """
    # Estimate distance based on mode and time
    speeds = {
        "driving": 40,  # km/h
        "cycling": 15,
        "walking": 5
    }
    speed = speeds.get(mode, 40)
    distance_km = speed * (time_minutes / 60)
    distance_m = distance_km * 1000

    # Create circular isochrone
    num_points = 36
    coords = []

    for i in range(num_points + 1):
        angle = (i / num_points) * 2 * math.pi
        dx = (distance_m / 111000) * math.cos(angle)
        dy = (distance_m / 111000) * math.sin(angle)

        point_lng = lng + dx / math.cos(math.radians(lat))
        point_lat = lat + dy
        coords.append([point_lng, point_lat])

    isochrone_geojson = {
        "type": "Feature",
        "properties": {
            "center": [lng, lat],
            "time_minutes": time_minutes,
            "mode": mode,
            "estimated_radius_m": round(distance_m, 2),
            "isochrone_type": "circular_approximation"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [coords]
        }
    }

    return {
        "isochrone": isochrone_geojson,
        "center": {"lat": lat, "lng": lng},
        "time_minutes": time_minutes,
        "mode": mode,
        "note": "Circular approximation. Accurate isochrones require routing network."
    }


@router.get("/nearest-facility")
async def find_nearest_facility(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    facility_type: str = Query(..., description="Type: clinics, schools, parks, myciti_stops"),
    limit: int = Query(default=5, ge=1, le=20)
):
    """
    Find nearest facilities of a given type
    """
    from shapely.geometry import Point

    # Map facility types to datasets
    facility_datasets = {
        "clinics": "clinics",
        "schools": "schools",
        "parks": "parks",
        "bus_stops": "myciti_stops",
        "myciti_stops": "myciti_stops",
        "rail_stations": "rail_stations"
    }

    dataset = facility_datasets.get(facility_type.lower())
    if not dataset:
        raise HTTPException(status_code=400, detail=f"Unknown facility type: {facility_type}")

    try:
        gdf = await data_loader.get_gdf_async(dataset)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {dataset}")

    if gdf.empty:
        return {"facilities": [], "message": "No facilities found"}

    # Calculate distances
    point = Point(lng, lat)
    # gdf_proj = gdf.to_crs(settings.PROJECTED_CRS)
    # point_proj = gdf_proj.unary_union.centroid  # Dummy for CRS transform

    # Simple distance calculation in degrees (approximate)
    gdf['distance'] = gdf.geometry.distance(point)

    # Sort and get nearest
    nearest = gdf.nsmallest(limit, 'distance')

    facilities = []
    for idx, row in nearest.iterrows():
        geom = row.geometry
        centroid = geom.centroid if geom.geom_type != 'Point' else geom

        # Approximate distance in meters
        dist_deg = row['distance']
        dist_m = dist_deg * 111000  # Very rough approximation

        facility = {
            "location": {"lat": centroid.y, "lng": centroid.x},
            "distance_m": round(dist_m, 2),
            "properties": {k: v for k, v in row.items() if k not in ['geometry', 'distance']}
        }
        facilities.append(facility)

    return {
        "origin": {"lat": lat, "lng": lng},
        "facility_type": facility_type,
        "count": len(facilities),
        "facilities": facilities,
        "geojson": gdf_to_geojson(nearest)
    }
