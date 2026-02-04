from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.spatial_analysis.services import services_analyzer

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("/access")
async def get_access(
    simplify: Optional[float] = Query(None, description="Geometry simplification tolerance")
):
    data = services_analyzer.run_analysis(simplify=simplify)
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data
