"""
Geocoding API - Search and geocoding endpoints

Provides REST API for:
- Address/place name search with autocomplete
- Reverse geocoding (coordinates to address)
- Local dataset search (suburbs, points of interest)
"""

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
import requests
from pydantic import BaseModel

from app.config import settings
from app.core.data_loader import data_loader

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/geocode", tags=["Geocoding & Search"])


class GeocodingResult(BaseModel):
    """Geocoding result model"""
    name: str
    display_name: str
    lat: float
    lon: float
    type: str
    source: str
    bbox: Optional[List[float]] = None
    properties: Optional[Dict[str, Any]] = None


class SearchResponse(BaseModel):
    """Search response model"""
    results: List[GeocodingResult]
    total: int
    query: str


# Cape Town bounding box for focused searches
CAPE_TOWN_BBOX = {
    "min_lon": 18.3,
    "min_lat": -34.4,
    "max_lon": 19.0,
    "max_lat": -33.5
}


@router.get("/search", response_model=SearchResponse)
async def search_places(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
    include_local: bool = Query(True, description="Include local dataset results"),
    include_osm: bool = Query(True, description="Include OpenStreetMap results")
):
    """
    Search for places by name with autocomplete support.

    Searches both local datasets (suburbs, facilities) and OpenStreetMap.
    Results are ranked by relevance and proximity to Cape Town.
    """
    results = []
    query_lower = q.lower()

    # Search local datasets first (faster, more relevant)
    if include_local:
        local_results = await _search_local_datasets(query_lower, limit)
        results.extend(local_results)

    # Search OpenStreetMap for additional results
    if include_osm and len(results) < limit:
        osm_results = await _search_nominatim(q, limit - len(results))
        results.extend(osm_results)

    # Remove duplicates and limit
    seen = set()
    unique_results = []
    for r in results:
        key = f"{r.lat:.4f},{r.lon:.4f}"
        if key not in seen:
            seen.add(key)
            unique_results.append(r)

    return SearchResponse(
        results=unique_results[:limit],
        total=len(unique_results),
        query=q
    )


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Reverse geocode coordinates to get location information.
    """
    # First check local datasets
    local_result = await _reverse_geocode_local(lat, lon)
    if local_result:
        return local_result

    # Fallback to Nominatim
    try:
        url = f"https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": lat,
            "lon": lon,
            "format": "json",
            "zoom": 18
        }
        headers = {"User-Agent": f"{settings.APP_NAME}/1.0"}

        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.ok:
            data = response.json()
            return {
                "name": data.get("display_name", "Unknown"),
                "lat": lat,
                "lon": lon,
                "type": data.get("type", "unknown"),
                "address": data.get("address", {})
            }
    except Exception as e:
        logger.warning(f"Nominatim reverse geocode failed: {e}")

    return {"name": "Unknown Location", "lat": lat, "lon": lon, "type": "unknown"}


@router.get("/autocomplete")
async def autocomplete(
    q: str = Query(..., min_length=1, description="Search prefix"),
    limit: int = Query(8, ge=1, le=20)
):
    """
    Fast autocomplete suggestions for search bar.

    Returns lightweight suggestions optimized for typeahead.
    """
    if len(q) < 2:
        return {"suggestions": []}

    query_lower = q.lower()
    suggestions = []

    # Search suburbs (most common search)
    try:
        suburbs = data_loader.get_gdf("suburbs")
        if not suburbs.empty and 'name' in suburbs.columns:
            matches = suburbs[suburbs['name'].str.lower().str.contains(query_lower, na=False)]
            for _, row in matches.head(limit).iterrows():
                centroid = row.geometry.centroid
                suggestions.append({
                    "text": row['name'],
                    "type": "suburb",
                    "lat": centroid.y,
                    "lon": centroid.x
                })
    except Exception as e:
        logger.warning(f"Suburb search failed: {e}")

    # Add common Cape Town landmarks if query matches
    landmarks = _get_matching_landmarks(query_lower)
    suggestions.extend(landmarks[:max(0, limit - len(suggestions))])

    return {"suggestions": suggestions[:limit]}


async def _search_local_datasets(query: str, limit: int) -> List[GeocodingResult]:
    """Search local GeoJSON datasets for matching features."""
    results = []

    # Search suburbs
    try:
        suburbs = data_loader.get_gdf("suburbs")
        if not suburbs.empty and 'name' in suburbs.columns:
            matches = suburbs[suburbs['name'].str.lower().str.contains(query, na=False)]
            for _, row in matches.head(limit).iterrows():
                centroid = row.geometry.centroid
                bounds = row.geometry.bounds
                results.append(GeocodingResult(
                    name=row.get('name', 'Unknown'),
                    display_name=f"{row.get('name', 'Unknown')}, Cape Town",
                    lat=centroid.y,
                    lon=centroid.x,
                    type="suburb",
                    source="local",
                    bbox=list(bounds),
                    properties={"suburb": row.get('name')}
                ))
    except Exception as e:
        logger.warning(f"Local suburb search failed: {e}")

    # Search other point datasets (clinics, schools, etc.)
    point_datasets = ["clinics", "schools", "parks", "myciti_stops"]
    for dataset in point_datasets:
        if len(results) >= limit:
            break
        try:
            gdf = data_loader.get_gdf(dataset)
            if not gdf.empty:
                # Find name column
                name_col = None
                for col in ['name', 'NAME', 'facility_name', 'stop_name']:
                    if col in gdf.columns:
                        name_col = col
                        break

                if name_col:
                    matches = gdf[gdf[name_col].str.lower().str.contains(query, na=False)]
                    for _, row in matches.head(3).iterrows():
                        if row.geometry.geom_type == 'Point':
                            lat, lon = row.geometry.y, row.geometry.x
                        else:
                            centroid = row.geometry.centroid
                            lat, lon = centroid.y, centroid.x

                        results.append(GeocodingResult(
                            name=row.get(name_col, 'Unknown'),
                            display_name=f"{row.get(name_col, 'Unknown')}, Cape Town",
                            lat=lat,
                            lon=lon,
                            type=dataset.rstrip('s'),
                            source="local",
                            properties={"dataset": dataset}
                        ))
        except Exception:
            pass

    return results


async def _search_nominatim(query: str, limit: int) -> List[GeocodingResult]:
    """Search OpenStreetMap Nominatim for places."""
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": f"{query}, Cape Town, South Africa",
            "format": "json",
            "limit": limit,
            "viewbox": f"{CAPE_TOWN_BBOX['min_lon']},{CAPE_TOWN_BBOX['max_lat']},{CAPE_TOWN_BBOX['max_lon']},{CAPE_TOWN_BBOX['min_lat']}",
            "bounded": 1
        }
        headers = {"User-Agent": f"{settings.APP_NAME}/1.0"}

        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.ok:
            data = response.json()
            return [
                GeocodingResult(
                    name=item.get("name", item.get("display_name", "").split(",")[0]),
                    display_name=item.get("display_name", ""),
                    lat=float(item["lat"]),
                    lon=float(item["lon"]),
                    type=item.get("type", "unknown"),
                    source="osm",
                    bbox=[float(x) for x in item.get("boundingbox", [])] if item.get("boundingbox") else None
                )
                for item in data
            ]
    except Exception as e:
        logger.warning(f"Nominatim search failed: {e}")

    return []


async def _reverse_geocode_local(lat: float, lon: float) -> Optional[Dict]:
    """Check if coordinates fall within a known suburb."""
    try:
        from shapely.geometry import Point
        point = Point(lon, lat)

        suburbs = data_loader.get_gdf("suburbs")
        if not suburbs.empty:
            for _, row in suburbs.iterrows():
                if row.geometry.contains(point):
                    return {
                        "name": row.get('name', 'Unknown Suburb'),
                        "lat": lat,
                        "lon": lon,
                        "type": "suburb",
                        "source": "local"
                    }
    except Exception as e:
        logger.warning(f"Local reverse geocode failed: {e}")

    return None


def _get_matching_landmarks(query: str) -> List[Dict]:
    """Return matching Cape Town landmarks."""
    landmarks = [
        {"text": "Table Mountain", "type": "landmark", "lat": -33.9628, "lon": 18.4098},
        {"text": "V&A Waterfront", "type": "landmark", "lat": -33.9033, "lon": 18.4197},
        {"text": "Cape Town International Airport", "type": "airport", "lat": -33.9648, "lon": 18.6017},
        {"text": "Cape Town CBD", "type": "district", "lat": -33.9249, "lon": 18.4241},
        {"text": "Robben Island", "type": "landmark", "lat": -33.8067, "lon": 18.3716},
        {"text": "Kirstenbosch Gardens", "type": "park", "lat": -33.9881, "lon": 18.4327},
        {"text": "Green Point Stadium", "type": "stadium", "lat": -33.9036, "lon": 18.4111},
        {"text": "University of Cape Town", "type": "university", "lat": -33.9577, "lon": 18.4612},
        {"text": "Groot Constantia", "type": "landmark", "lat": -34.0277, "lon": 18.4233},
        {"text": "Signal Hill", "type": "landmark", "lat": -33.9244, "lon": 18.3892},
    ]

    return [l for l in landmarks if query in l["text"].lower()]
