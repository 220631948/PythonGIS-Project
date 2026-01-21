from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.spatial_analysis.safety import safety_analyzer

router = APIRouter(prefix="/safety", tags=["Safety"])

@router.get("/precincts")
async def get_precincts(
    simplify: Optional[float] = Query(None, description="Geometry simplification tolerance")
):
    data = safety_analyzer.run_analysis(simplify=simplify)
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data
