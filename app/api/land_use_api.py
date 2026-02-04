from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.spatial_analysis.land_use import land_use_analyzer

router = APIRouter(prefix="/land-use", tags=["Land Use"])

@router.get("/zoning")
async def get_zoning(
    simplify: Optional[float] = Query(None, description="Geometry simplification tolerance")
):
    data = land_use_analyzer.run_analysis(simplify=simplify)
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data
