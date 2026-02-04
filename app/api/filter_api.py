"""
Filter API - Advanced attribute filtering and faceted search

Provides REST API for:
- Attribute-based filtering with multiple conditions
- Faceted search with counts
- Filter schema discovery
- Saved filter presets
"""

import logging
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Query, HTTPException, Body
from pydantic import BaseModel, Field
import pandas as pd
import geopandas as gpd

from app.config import settings
from app.core.data_loader import data_loader
from app.spatial_analysis.spatial_utils import gdf_to_geojson

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/filter", tags=["Filtering & Search"])


class FilterCondition(BaseModel):
    """A single filter condition"""
    field: str
    operator: str = "eq"  # eq, ne, gt, lt, gte, lte, contains, in, between
    value: Union[str, int, float, List, None]


class FilterRequest(BaseModel):
    """Filter request with multiple conditions"""
    dataset: str
    conditions: List[FilterCondition]
    logic: str = "and"  # and, or
    limit: Optional[int] = None
    simplify: Optional[float] = None


class FacetRequest(BaseModel):
    """Faceted search request"""
    dataset: str
    facet_fields: List[str]
    filters: Optional[List[FilterCondition]] = None
    limit_per_facet: int = 20


@router.get("/schema/{dataset_name}")
async def get_filter_schema(dataset_name: str):
    """
    Get the filter schema for a dataset.

    Returns available fields, their types, and possible values for categorical fields.
    """
    try:
        gdf = data_loader.get_gdf(dataset_name)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_name} not found")

        schema = {
            "dataset": dataset_name,
            "feature_count": len(gdf),
            "fields": []
        }

        for col in gdf.columns:
            if col == 'geometry':
                continue

            field_info = {
                "name": col,
                "display_name": col.replace("_", " ").title(),
                "type": _get_field_type(gdf[col]),
                "nullable": bool(gdf[col].isna().any())  # Convert numpy.bool to Python bool
            }

            # Add stats for numeric fields
            if field_info["type"] == "number":
                min_val = gdf[col].min()
                max_val = gdf[col].max()
                field_info["min"] = float(min_val) if pd.notna(min_val) else None
                field_info["max"] = float(max_val) if pd.notna(max_val) else None

            # Add unique values for categorical fields
            elif field_info["type"] == "string":
                unique_count = int(gdf[col].nunique())  # Convert to Python int
                field_info["unique_count"] = unique_count

                # If low cardinality, include all values
                if unique_count <= 50:
                    # Convert numpy types to native Python types
                    unique_vals = gdf[col].dropna().unique().tolist()
                    field_info["values"] = sorted([str(v) for v in unique_vals])

            # Add date range for temporal fields
            elif field_info["type"] == "datetime":
                try:
                    dates = pd.to_datetime(gdf[col], errors='coerce')
                    field_info["min_date"] = str(dates.min())
                    field_info["max_date"] = str(dates.max())
                except:
                    pass

            schema["fields"].append(field_info)

        return schema

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Schema generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def filter_dataset(request: FilterRequest):
    """
    Filter a dataset based on attribute conditions.

    Supports multiple filter conditions combined with AND/OR logic.
    """
    try:
        gdf = data_loader.get_gdf(request.dataset)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Dataset {request.dataset} not found")

        filtered = gdf.copy()

        if request.conditions:
            if request.logic == "and":
                for condition in request.conditions:
                    filtered = _apply_filter(filtered, condition)
            else:  # or
                mask = pd.Series([False] * len(filtered), index=filtered.index)
                for condition in request.conditions:
                    condition_mask = _get_filter_mask(filtered, condition)
                    mask = mask | condition_mask
                filtered = filtered[mask]

        # Apply limit
        if request.limit and request.limit > 0:
            filtered = filtered.head(request.limit)

        # Simplify geometry - use explicit copy to avoid numpy issues
        if request.simplify and request.simplify > 0:
            filtered = filtered.copy()
            filtered['geometry'] = filtered['geometry'].simplify(request.simplify)

        return {
            "dataset": request.dataset,
            "original_count": len(gdf),
            "filtered_count": len(filtered),
            "filters_applied": len(request.conditions),
            "geojson": gdf_to_geojson(filtered)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Filter query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/facets")
async def get_facets(request: FacetRequest):
    """
    Get faceted counts for a dataset.

    Returns value counts for specified fields, useful for building filter UIs.
    """
    try:
        gdf = data_loader.get_gdf(request.dataset)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Dataset {request.dataset} not found")

        # Apply pre-filters if any
        filtered = gdf.copy()
        if request.filters:
            for condition in request.filters:
                filtered = _apply_filter(filtered, condition)

        facets = {
            "dataset": request.dataset,
            "total_count": len(filtered),
            "facets": {}
        }

        for field in request.facet_fields:
            if field not in filtered.columns:
                continue

            # Get value counts
            counts = filtered[field].value_counts().head(request.limit_per_facet)

            facets["facets"][field] = {
                "field": field,
                "display_name": field.replace("_", " ").title(),
                "values": [
                    {"value": str(val), "count": int(count)}
                    for val, count in counts.items()
                ],
                "other_count": len(filtered) - counts.sum() if len(counts) == request.limit_per_facet else 0
            }

        return facets

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Facet generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quick/{dataset_name}")
async def quick_filter(
    dataset_name: str,
    field: str = Query(..., description="Field to filter"),
    value: str = Query(..., description="Value to match"),
    operator: str = Query("eq", description="Filter operator"),
    simplify: float = Query(0.0001)
):
    """
    Quick single-field filter endpoint.
    """
    try:
        condition = FilterCondition(field=field, operator=operator, value=value)
        request = FilterRequest(
            dataset=dataset_name,
            conditions=[condition],
            simplify=simplify
        )
        return await filter_dataset(request)

    except Exception as e:
        logger.error(f"Quick filter failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/{dataset_name}")
async def text_search(
    dataset_name: str,
    q: str = Query(..., min_length=1, description="Search query"),
    fields: Optional[str] = Query(None, description="Comma-separated fields to search"),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Full-text search across dataset fields.
    """
    try:
        gdf = data_loader.get_gdf(dataset_name)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_name} not found")

        query_lower = q.lower()

        # Determine which fields to search
        if fields:
            search_fields = [f.strip() for f in fields.split(",") if f.strip() in gdf.columns]
        else:
            # Search all string columns
            search_fields = gdf.select_dtypes(include=['object']).columns.tolist()

        if not search_fields:
            return {"results": [], "count": 0}

        # Create search mask
        mask = pd.Series([False] * len(gdf), index=gdf.index)
        for field in search_fields:
            field_mask = gdf[field].astype(str).str.lower().str.contains(query_lower, na=False)
            mask = mask | field_mask

        results = gdf[mask].head(limit)

        return {
            "query": q,
            "fields_searched": search_fields,
            "count": len(results),
            "geojson": gdf_to_geojson(results)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _get_field_type(series: pd.Series) -> str:
    """Determine the filter type for a pandas Series."""
    dtype = series.dtype

    if pd.api.types.is_numeric_dtype(dtype):
        return "number"
    elif pd.api.types.is_datetime64_any_dtype(dtype):
        return "datetime"
    elif pd.api.types.is_bool_dtype(dtype):
        return "boolean"
    else:
        # Check if it might be a date string
        try:
            sample = series.dropna().head(5)
            if len(sample) > 0:
                pd.to_datetime(sample)
                return "datetime"
        except:
            pass
        return "string"


def _apply_filter(gdf: gpd.GeoDataFrame, condition: FilterCondition) -> gpd.GeoDataFrame:
    """Apply a single filter condition to a GeoDataFrame."""
    mask = _get_filter_mask(gdf, condition)
    return gdf[mask]


def _get_filter_mask(gdf: gpd.GeoDataFrame, condition: FilterCondition) -> pd.Series:
    """Get a boolean mask for a filter condition."""
    field = condition.field
    op = condition.operator
    value = condition.value

    if field not in gdf.columns:
        raise HTTPException(status_code=400, detail=f"Field {field} not found in dataset")

    col = gdf[field]

    if op == "eq":
        return col == value
    elif op == "ne":
        return col != value
    elif op == "gt":
        return col > value
    elif op == "lt":
        return col < value
    elif op == "gte":
        return col >= value
    elif op == "lte":
        return col <= value
    elif op == "contains":
        return col.astype(str).str.lower().str.contains(str(value).lower(), na=False)
    elif op == "in":
        if isinstance(value, list):
            return col.isin(value)
        else:
            return col == value
    elif op == "between":
        if isinstance(value, list) and len(value) == 2:
            return (col >= value[0]) & (col <= value[1])
        else:
            raise HTTPException(status_code=400, detail="Between operator requires [min, max] value")
    elif op == "is_null":
        return col.isna()
    elif op == "is_not_null":
        return col.notna()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown operator: {op}")
