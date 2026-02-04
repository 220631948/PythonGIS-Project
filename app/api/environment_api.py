from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.spatial_analysis.environment import environment_analyzer

router = APIRouter(prefix="/environment", tags=["Environment"])

@router.get("/flood-risk")
async def get_flood_risk(
    simplify: Optional[float] = Query(None, description="Geometry simplification tolerance")
):
    data = environment_analyzer.run_analysis(simplify=simplify)
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data
