from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.spatial_analysis.utilities import utilities_analyzer

router = APIRouter(prefix="/utilities", tags=["Utilities"])

@router.get("/waste")
async def get_waste(
    simplify: Optional[float] = Query(None, description="Geometry simplification tolerance")
):
    data = utilities_analyzer.run_analysis(simplify=simplify)
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data
