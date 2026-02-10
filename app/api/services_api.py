from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional
from app.spatial_analysis.services import services_analyzer

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("/access")
async def get_access(
    simplify: Optional[float] = Query(None, description="Geometry simplification tolerance")
):
    data = services_analyzer.run_analysis(simplify=simplify)

    # Optimized response: if data is a pre-constructed JSON string, return it directly
    # This avoids parsing and re-serializing large GeoJSON objects
    if isinstance(data, str):
        return Response(content=data, media_type="application/json")

    # Standard error handling
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])

    return data
