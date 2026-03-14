"""
Temporal Data API - Time-based filtering and animation support

Provides REST API for:
- Filtering datasets by date/time ranges
- Temporal aggregation (by day, week, month)
- Animation frame generation for time-enabled datasets
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
import geopandas as gpd
import pandas as pd

from app.config import settings
from app.core.data_loader import data_loader
from app.spatial_analysis.spatial_utils import gdf_to_geojson

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/temporal", tags=["Temporal Analysis"])


class TimeRange(BaseModel):
    """Time range specification"""
    start: datetime
    end: datetime
    step: Optional[str] = "day"  # day, week, month


class TemporalDataResponse(BaseModel):
    """Response for temporal data queries"""
    geojson: Dict[str, Any]
    time_range: Dict[str, str]
    feature_count: int
    temporal_field: str


class AnimationFrame(BaseModel):
    """Single animation frame"""
    timestamp: str
    label: str
    feature_count: int
    geojson: Dict[str, Any]


class AnimationResponse(BaseModel):
    """Animation frames response"""
    frames: List[AnimationFrame]
    total_frames: int
    time_field: str
    bounds: Dict[str, float]


# Known temporal fields for different datasets
TEMPORAL_FIELDS = {
    "myciti_stops": ["created_date", "modified_date"],
    "development_applications": ["application_date", "decision_date"],
    "building_permits": ["issue_date", "expire_date"],
    "incidents": ["incident_date", "report_date"],
    "default": ["date", "created", "modified", "timestamp", "time", "datetime"]
}


@router.get("/datasets")
async def list_temporal_datasets():
    """
    List datasets that have temporal attributes.
    """
    temporal_datasets = []

    for dataset_name in settings.DATA_URLS.keys():
        try:
            gdf = await data_loader.get_gdf_async(dataset_name)
            if gdf.empty:
                continue

            # Check for temporal columns
            time_cols = _find_temporal_columns(gdf, dataset_name)
            if time_cols:
                temporal_datasets.append({
                    "id": dataset_name,
                    "name": dataset_name.replace("_", " ").title(),
                    "temporal_fields": time_cols,
                    "feature_count": len(gdf),
                    "date_range": _get_date_range(gdf, time_cols[0]) if time_cols else None
                })
        except Exception as e:
            logger.debug(f"Could not analyze {dataset_name} for temporal data: {e}")

    return {"datasets": temporal_datasets, "total": len(temporal_datasets)}


@router.get("/filter/{dataset_name}")
async def filter_by_time(
    dataset_name: str,
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    time_field: Optional[str] = Query(None, description="Field to filter on"),
    simplify: Optional[float] = Query(None, description="Geometry simplification")
):
    """
    Filter a dataset by time range.

    Returns GeoJSON features that fall within the specified time range.
    """
    try:
        gdf = await data_loader.get_gdf_async(dataset_name)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_name} is empty or not found")

        # Find temporal column
        if time_field and time_field in gdf.columns:
            temporal_col = time_field
        else:
            time_cols = _find_temporal_columns(gdf, dataset_name)
            if not time_cols:
                raise HTTPException(status_code=400, detail=f"No temporal fields found in {dataset_name}")
            temporal_col = time_cols[0]

        # Convert to datetime
        gdf[temporal_col] = pd.to_datetime(gdf[temporal_col], errors='coerce')

        # Filter by date range
        filtered = gdf.copy()
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            filtered = filtered[filtered[temporal_col] >= start_dt]
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            filtered = filtered[filtered[temporal_col] <= end_dt]

        # Simplify if requested
        if simplify and simplify > 0:
            filtered['geometry'] = filtered['geometry'].simplify(simplify)

        return TemporalDataResponse(
            geojson=gdf_to_geojson(filtered),
            time_range={
                "start": start_date or str(filtered[temporal_col].min()),
                "end": end_date or str(filtered[temporal_col].max())
            },
            feature_count=len(filtered),
            temporal_field=temporal_col
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Temporal filter failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/animation/{dataset_name}")
async def get_animation_frames(
    dataset_name: str,
    start_date: str = Query(..., description="Start date (ISO format)"),
    end_date: str = Query(..., description="End date (ISO format)"),
    interval: str = Query("day", description="Frame interval: hour, day, week, month"),
    time_field: Optional[str] = Query(None, description="Temporal field to use"),
    simplify: float = Query(0.0001, description="Geometry simplification for performance"),
    cumulative: bool = Query(False, description="Show cumulative data over time")
):
    """
    Generate animation frames for temporal visualization.

    Returns a series of GeoJSON snapshots at specified time intervals
    for creating map animations.
    """
    try:
        gdf = await data_loader.get_gdf_async(dataset_name)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_name} not found")

        # Find temporal column
        if time_field and time_field in gdf.columns:
            temporal_col = time_field
        else:
            time_cols = _find_temporal_columns(gdf, dataset_name)
            if not time_cols:
                raise HTTPException(status_code=400, detail="No temporal fields found")
            temporal_col = time_cols[0]

        # Parse dates
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

        # Convert temporal column
        gdf[temporal_col] = pd.to_datetime(gdf[temporal_col], errors='coerce')
        gdf = gdf.dropna(subset=[temporal_col])

        # Generate time steps
        frames = []
        current = start_dt
        delta = _get_timedelta(interval)

        while current <= end_dt:
            next_time = current + delta

            if cumulative:
                frame_data = gdf[gdf[temporal_col] <= next_time]
            else:
                frame_data = gdf[(gdf[temporal_col] >= current) & (gdf[temporal_col] < next_time)]

            if not frame_data.empty:
                # Simplify for performance
                simplified = frame_data.copy()
                simplified['geometry'] = simplified['geometry'].simplify(simplify)

                frames.append(AnimationFrame(
                    timestamp=current.isoformat(),
                    label=_format_time_label(current, interval),
                    feature_count=len(frame_data),
                    geojson=gdf_to_geojson(simplified)
                ))
            else:
                # Include empty frame to maintain animation continuity
                frames.append(AnimationFrame(
                    timestamp=current.isoformat(),
                    label=_format_time_label(current, interval),
                    feature_count=0,
                    geojson={"type": "FeatureCollection", "features": []}
                ))

            current = next_time

        # Calculate bounds
        bounds = gdf.total_bounds

        return AnimationResponse(
            frames=frames,
            total_frames=len(frames),
            time_field=temporal_col,
            bounds={
                "minX": bounds[0],
                "minY": bounds[1],
                "maxX": bounds[2],
                "maxY": bounds[3]
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Animation generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/aggregate/{dataset_name}")
async def temporal_aggregate(
    dataset_name: str,
    time_field: Optional[str] = Query(None),
    interval: str = Query("month", description="Aggregation interval"),
    stat: str = Query("count", description="Statistic: count, sum, mean"),
    value_field: Optional[str] = Query(None, description="Field for sum/mean stats")
):
    """
    Aggregate temporal data for charts and statistics.

    Returns time-series data suitable for charting.
    """
    try:
        gdf = await data_loader.get_gdf_async(dataset_name)
        if gdf.empty:
            raise HTTPException(status_code=404, detail="Dataset not found")

        # Find temporal column
        if time_field and time_field in gdf.columns:
            temporal_col = time_field
        else:
            time_cols = _find_temporal_columns(gdf, dataset_name)
            if not time_cols:
                raise HTTPException(status_code=400, detail="No temporal fields found")
            temporal_col = time_cols[0]

        # Convert and filter
        df = pd.DataFrame(gdf.drop(columns='geometry'))
        df[temporal_col] = pd.to_datetime(df[temporal_col], errors='coerce')
        df = df.dropna(subset=[temporal_col])

        # Set index and resample
        df = df.set_index(temporal_col)
        resample_freq = _get_resample_freq(interval)

        if stat == "count":
            result = df.resample(resample_freq).size()
        elif stat == "sum" and value_field and value_field in df.columns:
            result = df[value_field].resample(resample_freq).sum()
        elif stat == "mean" and value_field and value_field in df.columns:
            result = df[value_field].resample(resample_freq).mean()
        else:
            result = df.resample(resample_freq).size()

        return {
            "data": [
                {"timestamp": idx.isoformat(), "value": float(val) if pd.notna(val) else 0}
                for idx, val in result.items()
            ],
            "interval": interval,
            "stat": stat,
            "total": float(result.sum())
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Temporal aggregation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _find_temporal_columns(gdf: gpd.GeoDataFrame, dataset_name: str) -> List[str]:
    """Find columns that contain temporal data."""
    found = []

    # Check dataset-specific fields first
    specific_fields = TEMPORAL_FIELDS.get(dataset_name, [])
    for field in specific_fields:
        if field in gdf.columns:
            found.append(field)

    # Check default temporal field names
    for field in TEMPORAL_FIELDS["default"]:
        if field in gdf.columns and field not in found:
            found.append(field)

    # Check for datetime dtype columns
    for col in gdf.columns:
        if col not in found:
            if pd.api.types.is_datetime64_any_dtype(gdf[col]):
                found.append(col)
            elif gdf[col].dtype == 'object':
                # Try to parse as date
                try:
                    sample = gdf[col].dropna().head(5)
                    if len(sample) > 0:
                        pd.to_datetime(sample)
                        found.append(col)
                except Exception:
                    pass

    return found


def _get_date_range(gdf: gpd.GeoDataFrame, time_col: str) -> Optional[Dict[str, str]]:
    """Get the date range for a temporal column."""
    try:
        dates = pd.to_datetime(gdf[time_col], errors='coerce')
        dates = dates.dropna()
        if len(dates) > 0:
            return {
                "min": str(dates.min()),
                "max": str(dates.max())
            }
    except Exception:
        pass
    return None


def _get_timedelta(interval: str) -> timedelta:
    """Convert interval string to timedelta."""
    intervals = {
        "hour": timedelta(hours=1),
        "day": timedelta(days=1),
        "week": timedelta(weeks=1),
        "month": timedelta(days=30),
        "year": timedelta(days=365)
    }
    return intervals.get(interval, timedelta(days=1))


def _get_resample_freq(interval: str) -> str:
    """Convert interval to pandas resample frequency."""
    freqs = {
        "hour": "h",
        "day": "D",
        "week": "W",
        "month": "ME",
        "year": "YE"
    }
    return freqs.get(interval, "D")


def _format_time_label(dt: datetime, interval: str) -> str:
    """Format datetime for display based on interval."""
    formats = {
        "hour": "%Y-%m-%d %H:00",
        "day": "%Y-%m-%d",
        "week": "Week of %Y-%m-%d",
        "month": "%B %Y",
        "year": "%Y"
    }
    return dt.strftime(formats.get(interval, "%Y-%m-%d"))
