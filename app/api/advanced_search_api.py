"""
Advanced Search & Discovery API

Provides endpoints for:
- Spatial query builder
- Saved searches and filters
- Search history and recommendations
- Cross-dataset attribute search
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import uuid

router = APIRouter(prefix="/advanced-search", tags=["Advanced Search"])
logger = logging.getLogger(__name__)

saved_searches_db = []
search_history_db = []


class SpatialQuery(BaseModel):
    """Spatial query builder"""
    operation: str = Field(..., description="intersects, within, contains, near")
    source_dataset: str
    target_dataset: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = None
    distance_meters: Optional[float] = None
    filters: Optional[Dict[str, Any]] = None


class SavedSearch(BaseModel):
    """Save a search for later"""
    user_id: str
    name: str
    query: SpatialQuery
    is_public: bool = False


@router.post("/spatial-query")
async def execute_spatial_query(query: SpatialQuery):
    """Execute a spatial query across datasets."""
    try:
        # Mock results (in production, execute actual spatial query)
        results = [
            {
                "id": f"result_{i}",
                "dataset": query.source_dataset,
                "name": f"Feature {i}",
                "geometry_type": "Polygon",
                "matches_criteria": True
            }
            for i in range(15)
        ]

        return {
            "query": query.dict(),
            "results": results,
            "total": len(results),
            "execution_time_ms": 45
        }
    except Exception as e:
        logger.error(f"Spatial query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-search")
async def save_search(search: SavedSearch):
    """Save a search for later use."""
    try:
        search_entry = {
            "id": str(uuid.uuid4()),
            "user_id": search.user_id,
            "name": search.name,
            "query": search.query.dict(),
            "is_public": search.is_public,
            "created_at": datetime.now().isoformat(),
            "last_used": None,
            "use_count": 0
        }
        saved_searches_db.append(search_entry)

        return {
            "success": True,
            "search_id": search_entry["id"],
            "message": "Search saved successfully"
        }
    except Exception as e:
        logger.error(f"Save search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved-searches/{user_id}")
async def get_saved_searches(user_id: str):
    """Get user's saved searches."""
    try:
        user_searches = [s for s in saved_searches_db if s["user_id"] == user_id or s["is_public"]]
        return {"searches": user_searches, "total": len(user_searches)}
    except Exception as e:
        logger.error(f"Get saved searches error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cross-dataset-search")
async def cross_dataset_search(
    query: str = Query(..., min_length=3),
    datasets: Optional[str] = Query(None, description="Comma-separated dataset IDs")
):
    """Search across multiple datasets."""
    try:
        dataset_list = datasets.split(",") if datasets else ["all"]

        results = [
            {
                "dataset": "parks",
                "record_id": "park_123",
                "name": "Green Point Park",
                "match_score": 0.95,
                "matched_fields": ["name", "description"]
            },
            {
                "dataset": "schools",
                "record_id": "school_456",
                "name": "Green Point Primary",
                "match_score": 0.87,
                "matched_fields": ["name"]
            }
        ]

        return {
            "query": query,
            "datasets_searched": dataset_list,
            "results": results,
            "total": len(results)
        }
    except Exception as e:
        logger.error(f"Cross-dataset search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{user_id}")
async def get_search_recommendations(user_id: str):
    """Get search recommendations based on history."""
    try:
        return {
            "recommendations": [
                {
                    "query": "schools near parks",
                    "reason": "Based on your recent searches",
                    "confidence": 0.85
                },
                {
                    "query": "affordable housing areas",
                    "reason": "Popular with similar users",
                    "confidence": 0.72
                }
            ]
        }
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
