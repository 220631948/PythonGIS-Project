from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional
from app.spatial_analysis.safety import safety_analyzer

router = APIRouter(prefix="/safety", tags=["Safety"])

@router.get("/precincts")
async def get_precincts(
    simplify: Optional[float] = Query(None, description="Geometry simplification tolerance")
):
    data = safety_analyzer.run_analysis(simplify=simplify)
    # Performance optimization: If the analyzer returns a pre-serialized JSON string,
    # return it directly via Response to bypass FastAPI/Pydantic serialization overhead.
    if isinstance(data, str):
        return Response(content=data, media_type="application/json")
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data
