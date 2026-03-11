"""
3D Visualization & Terrain Analysis API

Provides endpoints for:
- Building extrusion with height data
- Terrain elevation profiles
- Shadow analysis for solar potential
- 3D viewshed analysis
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import math
import numpy as np

router = APIRouter(prefix="/3d", tags=["3D Visualization"])
logger = logging.getLogger(__name__)


class BuildingExtrusionRequest(BaseModel):
    """Request for building extrusion data"""
    bounds: Dict[str, float] = Field(..., description="Bounding box (minLat, minLng, maxLat, maxLng)")
    height_attribute: Optional[str] = Field("height", description="Attribute name for building height")
    default_height: float = Field(10.0, description="Default height in meters if not specified")


class ElevationProfileRequest(BaseModel):
    """Request for elevation profile along a path"""
    coordinates: List[List[float]] = Field(..., description="List of [lng, lat] coordinates")
    samples: int = Field(100, description="Number of elevation samples", ge=10, le=1000)


class ShadowAnalysisRequest(BaseModel):
    """Request for shadow analysis"""
    geometry: Dict[str, Any] = Field(..., description="GeoJSON geometry (building/obstacle)")
    height: float = Field(..., description="Height of the structure in meters")
    datetime: str = Field(..., description="ISO datetime for shadow calculation")
    location: Dict[str, float] = Field(..., description="Location (lat, lng)")


class ViewshedRequest(BaseModel):
    """Request for 3D viewshed analysis"""
    observer_lat: float
    observer_lng: float
    observer_height: float = Field(1.7, description="Observer height in meters")
    radius_meters: float = Field(1000, description="Analysis radius")
    resolution: int = Field(50, description="Grid resolution", ge=10, le=200)


@router.post("/buildings/extrude")
async def get_building_extrusion(request: BuildingExtrusionRequest):
    """
    Get building footprints with height data for 3D extrusion.

    Returns GeoJSON FeatureCollection with height properties.
    """
    try:
        from app.core.data_loader import data_loader
        from shapely.geometry import box

        # Load buildings dataset
        buildings_gdf = data_loader.get_gdf("buildings")

        # Create bounding box
        bounds = request.bounds
        bbox = box(bounds["minLng"], bounds["minLat"], bounds["maxLat"], bounds["maxLng"])

        # Filter buildings within bounds
        filtered = buildings_gdf[buildings_gdf.intersects(bbox)]

        # Add height attribute if missing
        if request.height_attribute not in filtered.columns:
            filtered[request.height_attribute] = request.default_height
        else:
            # Fill missing heights with default
            filtered[request.height_attribute].fillna(request.default_height, inplace=True)

        # Prepare response
        features = []
        for idx, row in filtered.iterrows():
            feature = {
                "type": "Feature",
                "geometry": row.geometry.__geo_interface__,
                "properties": {
                    "height": float(row[request.height_attribute]),
                    "base_height": 0,
                    "id": str(idx)
                }
            }
            features.append(feature)

        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "count": len(features),
                "bounds": request.bounds
            }
        }

    except Exception as e:
        logger.error(f"Building extrusion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/elevation/profile")
async def get_elevation_profile(request: ElevationProfileRequest):
    """
    Get elevation profile along a path.

    Uses SRTM or other DEM data to sample elevations.
    """
    try:
        # In production, integrate with SRTM, Mapzen, or local DEM
        # For now, return mock data with realistic elevation patterns

        coords = request.coordinates
        samples = request.samples

        # Calculate distances along path
        distances = [0]
        total_distance = 0

        for i in range(1, len(coords)):
            lat1, lng1 = coords[i-1][1], coords[i-1][0]
            lat2, lng2 = coords[i][1], coords[i][0]

            # Haversine distance
            R = 6371000  # Earth radius in meters
            phi1, phi2 = math.radians(lat1), math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lng2 - lng1)

            a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c

            total_distance += distance
            distances.append(total_distance)

        # Generate sample points along the path
        sample_distances = np.linspace(0, total_distance, samples)
        elevations = []
        sample_coords = []

        for sample_dist in sample_distances:
            # Find which segment this sample falls on
            segment_idx = 0
            for i in range(len(distances) - 1):
                if distances[i] <= sample_dist <= distances[i + 1]:
                    segment_idx = i
                    break

            # Interpolate coordinates
            if segment_idx < len(coords) - 1:
                t = (sample_dist - distances[segment_idx]) / (distances[segment_idx + 1] - distances[segment_idx])
                lng = coords[segment_idx][0] + t * (coords[segment_idx + 1][0] - coords[segment_idx][0])
                lat = coords[segment_idx][1] + t * (coords[segment_idx + 1][1] - coords[segment_idx][1])
            else:
                lng, lat = coords[-1][0], coords[-1][1]

            # Mock elevation (in production, query DEM)
            # Simulate terrain with some variation
            elevation = 50 + 30 * math.sin(sample_dist / 200) + 10 * math.cos(sample_dist / 500)

            elevations.append(round(elevation, 2))
            sample_coords.append([lng, lat])

        return {
            "type": "ElevationProfile",
            "distances": sample_distances.tolist(),
            "elevations": elevations,
            "coordinates": sample_coords,
            "total_distance": total_distance,
            "min_elevation": min(elevations),
            "max_elevation": max(elevations),
            "elevation_gain": sum(max(0, elevations[i+1] - elevations[i]) for i in range(len(elevations)-1)),
            "elevation_loss": sum(max(0, elevations[i] - elevations[i+1]) for i in range(len(elevations)-1))
        }

    except Exception as e:
        logger.error(f"Elevation profile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shadow/analysis")
async def calculate_shadow(request: ShadowAnalysisRequest):
    """
    Calculate shadow cast by a structure at a given time.

    Returns shadow polygon geometry.
    """
    try:
        from shapely.geometry import shape, mapping
        from shapely import affinity
        from datetime import datetime

        # Parse datetime
        dt = datetime.fromisoformat(request.datetime.replace('Z', '+00:00'))

        # Calculate sun position (simplified - use pysolar or pvlib in production)
        lat = request.location["lat"]
        lng = request.location["lng"]

        # Simplified solar angle calculation
        hour = dt.hour + dt.minute / 60.0
        day_of_year = dt.timetuple().tm_yday

        # Solar elevation angle (simplified)
        solar_elevation = 90 - abs(lat) + 23.5 * math.sin(2 * math.pi * (day_of_year - 81) / 365)
        solar_elevation = max(0, solar_elevation)  # Can't be negative

        # Solar azimuth (simplified - south at noon)
        solar_azimuth = 180 + 15 * (hour - 12)

        # Calculate shadow length
        if solar_elevation > 0:
            shadow_length = request.height / math.tan(math.radians(solar_elevation))
        else:
            shadow_length = 0  # No shadow at night

        # Create shadow geometry
        geom = shape(request.geometry)

        if shadow_length > 0:
            # Translate geometry in direction of shadow
            shadow_geom = affinity.translate(
                geom,
                xoff=shadow_length * math.sin(math.radians(solar_azimuth)),
                yoff=shadow_length * math.cos(math.radians(solar_azimuth))
            )
        else:
            shadow_geom = geom  # No shadow

        return {
            "type": "Feature",
            "geometry": mapping(shadow_geom),
            "properties": {
                "shadow_length": round(shadow_length, 2),
                "solar_elevation": round(solar_elevation, 2),
                "solar_azimuth": round(solar_azimuth, 2),
                "datetime": request.datetime,
                "height": request.height
            }
        }

    except Exception as e:
        logger.error(f"Shadow analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/viewshed")
async def calculate_viewshed(request: ViewshedRequest):
    """
    Calculate 3D viewshed from observer location.

    Returns grid of visible/non-visible cells.
    """
    try:
        # In production, use DEM data and line-of-sight algorithms
        # For now, return mock viewshed grid

        resolution = request.resolution
        radius = request.radius_meters

        # Create grid
        cell_size = radius / resolution
        grid = []

        for i in range(resolution):
            for j in range(resolution):
                # Calculate cell center
                x = (i - resolution/2) * cell_size
                y = (j - resolution/2) * cell_size

                distance = math.sqrt(x**2 + y**2)

                if distance <= radius:
                    # Mock visibility (in production, calculate line-of-sight)
                    # Simulate some obstacles
                    visible = not (
                        (abs(x - 200) < 50 and abs(y - 200) < 50) or
                        (abs(x + 300) < 100 and abs(y - 100) < 100)
                    )

                    # Convert to lat/lng offset
                    lat_offset = y / 111000  # Approximate meters to degrees
                    lng_offset = x / (111000 * math.cos(math.radians(request.observer_lat)))

                    grid.append({
                        "lat": request.observer_lat + lat_offset,
                        "lng": request.observer_lng + lng_offset,
                        "visible": visible,
                        "distance": round(distance, 2)
                    })

        visible_count = sum(1 for cell in grid if cell["visible"])

        return {
            "type": "Viewshed",
            "observer": {
                "lat": request.observer_lat,
                "lng": request.observer_lng,
                "height": request.observer_height
            },
            "radius": radius,
            "resolution": resolution,
            "cells": grid,
            "statistics": {
                "total_cells": len(grid),
                "visible_cells": visible_count,
                "visibility_percentage": round(100 * visible_count / len(grid), 2)
            }
        }

    except Exception as e:
        logger.error(f"Viewshed analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/terrain/tiles/{z}/{x}/{y}")
async def get_terrain_tile(
    z: int = Query(..., description="Zoom level"),
    x: int = Query(..., description="Tile X coordinate"),
    y: int = Query(..., description="Tile Y coordinate")
):
    """
    Get terrain RGB tile for 3D terrain rendering.

    Returns Mapbox terrain-rgb encoded elevation data.
    """
    try:
        # In production, serve actual terrain tiles from DEM
        # For now, return metadata about the tile

        return {
            "tile": f"{z}/{x}/{y}",
            "format": "terrain-rgb",
            "encoding": "mapbox",
            "note": "In production, this would return terrain-rgb PNG tiles"
        }

    except Exception as e:
        logger.error(f"Terrain tile error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
