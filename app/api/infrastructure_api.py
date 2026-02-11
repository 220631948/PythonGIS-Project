from fastapi import APIRouter, Query
from app.spatial_analysis.infrastructure import infrastructure_analyzer

router = APIRouter(tags=["Infrastructure"])

@router.get("/infrastructure/{layer_id}")
async def get_infrastructure_layer(
    layer_id: str,
    simplify: float = Query(0.0, ge=0.0, le=0.1)
):
    """Returns a specific infrastructure layer (parks, clinics, etc.)"""
    return infrastructure_analyzer.get_layer(layer_id, simplify)
