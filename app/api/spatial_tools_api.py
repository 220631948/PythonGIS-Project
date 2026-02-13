import sys
import json
import logging
import re
from pathlib import Path
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import geopandas as gpd
from shapely.geometry import shape
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.core.database import get_db
from app.core.data_loader import data_loader
from app.config import settings
from app.schemas.spatial import GeoJSONGeometry, ClusterRequest
from app.utils.validation import validate_layer_name, validate_geometry_complexity

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/spatial", tags=["Spatial Tools"])

class PointInPolygonRequest(BaseModel):
    polygon: GeoJSONGeometry  # Now uses validated GeoJSON
    layers: List[str]

@router.post("/point-in-polygon")
async def point_in_polygon(request: PointInPolygonRequest):
    """
    Counts points in a user-defined polygon from specified layers.

    **Sprint 3 - Enhanced with input validation**
    """
    try:
        # Validate layer names
        for layer in request.layers:
            is_valid, error = validate_layer_name(layer)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Invalid layer name '{layer}': {error}")

        # Convert GeoJSON to Shapely geometry
        user_poly = shape(request.polygon.model_dump())

        # Validate geometry complexity
        is_valid, error = validate_geometry_complexity(user_poly, max_vertices=5000)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)

        if not user_poly.is_valid:
            raise HTTPException(status_code=400, detail="Invalid polygon geometry")

        results = {}

        def _count_points_within_polygon(gdf: gpd.GeoDataFrame) -> int:
            return int(gdf[gdf.geometry.within(user_poly)].shape[0])

        for layer in request.layers:
            gdf = await data_loader.get_gdf_async(layer)
            if gdf.empty:
                results[layer] = 0
                continue

            # Spatial intersection
            count = await run_in_threadpool(_count_points_within_polygon, gdf)
            results[layer] = count

        def _polygon_area_sqm() -> float:
            return float(
                gpd.GeoSeries([user_poly], crs=settings.TARGET_CRS)
                .to_crs(settings.PROJECTED_CRS)
                .area.iloc[0]
            )

        area_sqm = await run_in_threadpool(_polygon_area_sqm)

        return {
            "counts": results,
            "area_sqm": area_sqm,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/buffer")
async def get_buffer(
    lat: float, 
    lon: float, 
    distance: float = Query(500, description="Buffer distance in meters"),
    db: AsyncSession = Depends(get_db)
):
    """Returns a GeoJSON buffer around a point using PostGIS."""
    try:
        # Use PostGIS ST_Buffer
        query = text("""
            SELECT ST_AsGeoJSON(
                ST_Buffer(
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
                    :distance
                )::geometry
            ) as geojson
        """)

        result = await db.execute(query, {"lon": lon, "lat": lat, "distance": distance})
        geojson_result = result.scalar_one_or_none()

        if geojson_result:
            geom = json.loads(geojson_result)
            return {
                "type": "Feature",
                "geometry": geom,
                "properties": {"type": "buffer", "radius": distance}
            }
        else:
             raise HTTPException(status_code=500, detail="Buffer generation failed")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nearby")
async def get_nearby_features(
    layer: str,
    lat: float,
    lon: float,
    radius: float = 1000.0,
    db: AsyncSession = Depends(get_db)
):
    """
    Finds features in a specific layer within `radius` meters of (lat, lon) using PostGIS ST_DWithin.
    """
    # Map friendly layer names to tables if needed
    TABLE_MAPPING = {
        "schools": "service_facilities",
        "clinics": "service_facilities",
        "libraries": "service_facilities",
        "hospitals": "service_facilities",
        "myciti_stops": "transport_stops",
        "rail_stations": "transport_stops",
        "taxi_ranks": "transport_stops"
    }

    table_name = TABLE_MAPPING.get(layer, layer.lower().replace('-', '_'))
    if not re.fullmatch(r"[a-z_][a-z0-9_]*", table_name):
        raise HTTPException(status_code=400, detail="Invalid layer name")

    # Filter for consolidated tables
    type_filter = ""
    query_params: Dict[str, Any] = {"lon": lon, "lat": lat, "radius": radius}
    if layer in ["schools", "clinics", "libraries", "hospitals"]:
        # Remove plural s for singular type in DB
        facility_type = layer[:-1]
        type_filter = "AND facility_type = :facility_type"
        query_params["facility_type"] = facility_type
    elif layer == "myciti_stops":
        type_filter = "AND stop_type = :stop_type"
        query_params["stop_type"] = "bus_stop"
    elif layer == "rail_stations":
        type_filter = "AND stop_type = :stop_type"
        query_params["stop_type"] = "rail_station"

    try:
        # Verify table exists in spatial_layers or simple check to avoid SQL injection on table name
        # Ideally query known tables from settings/metadata.
        # For prototype, we assume table_name is safe via mapping or clean logic.

        # Use simple SQL construction for table name (parameterized queries can't handle table names)
        # Check against allow-list or schema first for safety in prod.

        query_sql = f"""
            SELECT id, name, 
                   ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) as distance_meters,
                   ST_AsGeoJSON(geom) as geojson 
            FROM "{table_name}"
            WHERE ST_DWithin(
                geom::geography, 
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
                :radius
            )
            {type_filter}
            ORDER BY distance_meters ASC
            LIMIT 100
        """

        result = await db.execute(text(query_sql), query_params)

        features = []
        for row in result:
            row_dict = dict(row._mapping)
            geom = json.loads(row_dict.pop('geojson')) if row_dict.get('geojson') else None

            features.append({
                "type": "Feature",
                "geometry": geom,
                "properties": row_dict
            })

        return {
            "type": "FeatureCollection",
            "features": features,
            "count": len(features)
        }

    except Exception as e:
        logger.warning(f"PostGIS query failed for {layer}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cluster")
async def cluster_points(request: ClusterRequest):
    """
    Cluster point features using PostGIS ST_ClusterKMeans.

    **Sprint 3 - E.2.1: GeoJSON Clustering**

    Uses validated ClusterRequest schema consistent with DensityAnalysisRequest.
    Leverages Sprint 3 spatial indexes for sub-100ms performance.

    Args:
        request: ClusterRequest with layer_name, bounds, num_clusters, zoom_level

    Returns:
        GeoJSON FeatureCollection with cluster centroids and metadata:
        - cluster_id: Cluster identifier
        - point_count: Number of points in cluster
        - is_cluster: Boolean (true if > 1 point)
        - bounds: Envelope of cluster

    Performance:
        - Uses GIST spatial indexes from migration 007
        - Bounding box filtering for viewport-only clustering
        - Adaptive cluster count based on zoom level (if provided)
        - Target: < 500ms for 100k points
    """
    from app.core.database import get_clustered_points
    from app.models.sql_models import LAYER_TABLE_MAP

    try:
        # Validate layer name (SQL injection prevention)
        is_valid, error_msg = validate_layer_name(request.layer_name)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        # Map layer to table name
        table_name = LAYER_TABLE_MAP.get(request.layer_name)
        if not table_name:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown layer: {request.layer_name}"
            )

        # Build bounds tuple from validated BoundsSchema
        bounds = (
            request.bounds.min_lng,
            request.bounds.min_lat,
            request.bounds.max_lng,
            request.bounds.max_lat,
        )

        # Call PostGIS clustering function
        # Note: We override cluster_count by passing zoom indirectly
        # For direct control, we'd need to modify get_clustered_points signature
        result = await get_clustered_points(
            table_name=table_name,
            zoom=request.zoom_level or 12,  # Default zoom if not provided
            bounds=bounds,
            geom_column="geom",
            max_features=10000,  # Leverage Sprint 3 DOS protection
        )

        logger.info(
            f"Clustered {result['metadata']['total_points']} points "
            f"into {result['metadata']['cluster_count']} clusters "
            f"for layer {request.layer_name}"
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clustering error for {request.layer_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
