from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional
from app.spatial_analysis.transport import transport_analyzer

router = APIRouter(prefix="/transport", tags=["Transport"])

@router.get("/accessibility")
async def get_accessibility(
    lat: float = Query(..., description="Latitude of the point"),
    lon: float = Query(..., description="Longitude of the point"),
    simplify: Optional[float] = Query(None, description="Geometry simplification tolerance")
):
    data = transport_analyzer.run_analysis(lat=lat, lon=lon, simplify=simplify)

    # Fast path: return raw JSON string to avoid dict double serialization
    if isinstance(data, str):
        return Response(content=data, media_type="application/json")

    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data
