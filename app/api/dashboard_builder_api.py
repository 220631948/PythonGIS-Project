"""
Custom Dashboard Builder API

Provides endpoints for:
- Drag-and-drop widget configuration
- User-defined KPIs and charts
- Saved dashboard templates
- Role-based dashboard presets
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import uuid

router = APIRouter(prefix="/dashboard-builder", tags=["Dashboard Builder"])
logger = logging.getLogger(__name__)

dashboards_db = []
widgets_db = []


class Widget(BaseModel):
    type: str = Field(..., description="chart, map, metric, table, text")
    title: str
    config: Dict[str, Any]
    position: Dict[str, int] = Field(..., description="x, y, width, height")


class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    widgets: List[Widget]
    layout: str = Field("grid", description="grid, flex")
    is_public: bool = False


@router.post("/dashboards")
async def create_dashboard(dashboard: DashboardCreate, user_id: str):
    """Create a custom dashboard."""
    try:
        dashboard_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": dashboard.name,
            "description": dashboard.description,
            "widgets": [w.dict() for w in dashboard.widgets],
            "layout": dashboard.layout,
            "is_public": dashboard.is_public,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        dashboards_db.append(dashboard_entry)

        return {
            "success": True,
            "dashboard_id": dashboard_entry["id"],
            "message": "Dashboard created successfully"
        }
    except Exception as e:
        logger.error(f"Dashboard creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboards/{user_id}")
async def get_user_dashboards(user_id: str):
    """Get all dashboards for a user."""
    try:
        user_dashboards = [d for d in dashboards_db if d["user_id"] == user_id or d["is_public"]]
        return {"dashboards": user_dashboards, "total": len(user_dashboards)}
    except Exception as e:
        logger.error(f"Get dashboards error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates")
async def get_dashboard_templates():
    """Get pre-built dashboard templates."""
    try:
        templates = [
            {
                "id": "urban_planning",
                "name": "Urban Planning Dashboard",
                "description": "Population, land use, and infrastructure metrics",
                "widgets": [
                    {"type": "metric", "title": "Total Population", "config": {"dataset": "census"}},
                    {"type": "chart", "title": "Land Use Distribution", "config": {"chartType": "pie"}},
                    {"type": "map", "title": "Development Projects", "config": {"layers": ["development"]}}
                ]
            },
            {
                "id": "safety_monitoring",
                "name": "Safety Monitoring Dashboard",
                "description": "Crime stats and incident tracking",
                "widgets": [
                    {"type": "metric", "title": "Incidents This Month", "config": {}},
                    {"type": "chart", "title": "Crime Trends", "config": {"chartType": "line"}},
                    {"type": "map", "title": "Crime Hotspots", "config": {"layers": ["crime"]}}
                ]
            }
        ]
        return {"templates": templates}
    except Exception as e:
        logger.error(f"Get templates error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
