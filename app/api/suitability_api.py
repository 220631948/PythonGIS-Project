"""
Site Suitability API - Advanced endpoints for comprehensive site analysis

Provides REST API for:
- Point-based site suitability analysis with detailed criteria
- Polygon/area suitability analysis with spatial overlays
- Custom criteria weighting and sensitivity analysis
- Multi-site comparison and ranking
- Environmental impact assessment
- Development feasibility scoring
- Risk assessment integration
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
import json

from app.spatial_analysis.site_suitability import (
    site_analyzer,
    SuitabilityCriterion,
    DEFAULT_WEIGHTS,
    SUITABILITY_THRESHOLDS
)

router = APIRouter(prefix="/suitability", tags=["Site Suitability Analysis"])


class DevelopmentType(str, Enum):
    """Supported development types"""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    MIXED_USE = "mixed_use"
    INSTITUTIONAL = "institutional"
    RECREATIONAL = "recreational"


class AnalysisMode(str, Enum):
    """Analysis modes"""
    STANDARD = "standard"
    DETAILED = "detailed"
    COMPREHENSIVE = "comprehensive"


class CriterionResultResponse(BaseModel):
    """Detailed result for a single criterion"""
    criterion: str
    name: str
    description: str
    score: float
    weight: float
    weighted_score: float
    max_score: float
    details: Dict[str, Any]
    constraints: List[str]
    risk_level: str
    data_sources: List[str]


class EnvironmentalImpactResponse(BaseModel):
    """Environmental impact assessment"""
    biodiversity_impact: float
    wetland_impact: float
    protected_area_overlap: float
    flood_risk: float
    air_quality_impact: float
    noise_impact: float
    carbon_footprint: float


class InfrastructureAccessResponse(BaseModel):
    """Infrastructure access analysis"""
    road_access_score: float
    public_transport_score: float
    utility_access_score: float
    nearest_road_distance: float
    nearest_bus_stop_distance: float
    nearest_train_station_distance: float
    electricity_availability: bool
    water_availability: bool
    sewerage_availability: bool


class EconomicFeasibilityResponse(BaseModel):
    """Economic feasibility assessment"""
    land_value_estimate: float
    development_cost_estimate: float
    roi_potential: float
    market_demand_score: float
    accessibility_score: float
    zoning_compliance_cost: float


class SuitabilityResponse(BaseModel):
    """Comprehensive suitability analysis response"""
    location: Dict[str, float]
    overall_score: float
    suitability_class: str
    criteria_results: List[CriterionResultResponse]
    constraints_violated: List[str]
    recommendations: List[str]


class PolygonAnalysisRequest(BaseModel):
    """Request for polygon-based analysis"""
    geometry: Dict = Field(..., description="GeoJSON geometry object")
    development_type: DevelopmentType = Field(default=DevelopmentType.RESIDENTIAL)
    analysis_mode: AnalysisMode = Field(default=AnalysisMode.STANDARD)
    weights: Optional[Dict[str, float]] = Field(default=None, description="Custom criteria weights")
    include_environmental_impact: bool = Field(default=True)
    include_economic_analysis: bool = Field(default=False)
    sensitivity_analysis: bool = Field(default=False)


class MultiSiteComparisonRequest(BaseModel):
    """Request for comparing multiple sites"""
    sites: List[Dict[str, float]] = Field(..., description="List of {lat, lng} coordinates")
    development_type: DevelopmentType = Field(default=DevelopmentType.RESIDENTIAL)
    ranking_criteria: List[str] = Field(default=["overall_score"], description="Criteria to rank by")
    include_details: bool = Field(default=True)


class SensitivityAnalysisRequest(BaseModel):
    """Request for sensitivity analysis"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    development_type: DevelopmentType = Field(default=DevelopmentType.RESIDENTIAL)
    weight_variations: Dict[str, List[float]] = Field(..., description="Weight ranges for sensitivity testing")


class SiteRankingResponse(BaseModel):
    """Response for multi-site comparison"""
    sites: List[SuitabilityResponse]
    ranking: List[Dict[str, Any]]
    best_site: Dict[str, Any]
    comparison_summary: Dict[str, Any]


class SensitivityResult(BaseModel):
    """Result of sensitivity analysis"""
    base_case: SuitabilityResponse
    sensitivity_results: List[Dict[str, Any]]
    most_influential_criteria: List[str]
    stability_score: float


@router.get("/analyze", response_model=SuitabilityResponse)
async def analyze_site(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    development_type: str = Query(default="residential", description="Development type"),
    weights: Optional[str] = Query(default=None, description="Custom weights as JSON string")
):
    """
    Analyze site suitability for a point location

    Evaluates multiple criteria including:
    - Environmental constraints (flood risk, biodiversity, wetlands)
    - Planning compliance (zoning, urban edge)
    - Infrastructure access (roads, transport, utilities)

    Returns overall score (0-100) and suitability classification.
    """
    custom_weights = None
    if weights:
        try:
            custom_weights = json.loads(weights)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid weights JSON format")

    result = site_analyzer.analyze_point(lat, lng, development_type, custom_weights)

    return SuitabilityResponse(
        location=result.location,
        overall_score=result.overall_score,
        suitability_class=result.suitability_class,
        criteria_results=[
            CriterionResultResponse(
                criterion=r.criterion,
                name=r.criterion.replace('_', ' ').title(),
                description=r.criterion.replace('_', ' ').title(),
                score=r.score,
                weight=r.weight,
                weighted_score=r.weighted_score,
                max_score=100,
                details=r.details,
                constraints=r.constraints,
                risk_level="Low" if r.score > 70 else "Medium" if r.score > 40 else "High",
                data_sources=[]
            )
            for r in result.criteria_results
        ],
        constraints_violated=result.constraints_violated,
        recommendations=result.recommendations
    )


@router.post("/analyze-polygon")
async def analyze_polygon(request: PolygonAnalysisRequest):
    """
    Analyze site suitability for a polygon area

    Performs intersection analysis with constraint layers
    and calculates area-weighted suitability scores.
    """
    result = site_analyzer.analyze_polygon(
        request.geometry,
        request.development_type,
        request.weights
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.post("/compare")
async def compare_sites(request: MultiSiteComparisonRequest):
    """
    Compare suitability of multiple sites

    Returns ranked list of sites by suitability score.
    """
    results = []

    for i, site in enumerate(request.sites):
        if "lat" not in site or "lng" not in site:
            continue

        result = site_analyzer.analyze_point(
            site["lat"],
            site["lng"],
            request.development_type,
            request.weights
        )

        results.append({
            "site_id": i + 1,
            "location": result.location,
            "overall_score": result.overall_score,
            "suitability_class": result.suitability_class,
            "constraints_count": len(result.constraints_violated)
        })

    # Sort by score descending
    results.sort(key=lambda x: x["overall_score"], reverse=True)

    # Add ranking
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return {
        "comparison": results,
        "best_site": results[0] if results else None,
        "total_sites_analyzed": len(results)
    }


@router.post("/sensitivity-analysis")
async def sensitivity_analysis(request: SensitivityAnalysisRequest):
    """
    Perform sensitivity analysis for site suitability

    Evaluates how changes in criteria weights affect
    the overall suitability score and ranking.
    """
    base_result = site_analyzer.analyze_point(
        request.lat,
        request.lng,
        request.development_type
    )

    sensitivity_results = []
    for criterion, variations in request.weight_variations.items():
        for weight in variations:
            # Skip if weight is the same as the default
            if weight == DEFAULT_WEIGHTS.get(criterion, 0):
                continue

            # Apply weight variation
            modified_weights = {**DEFAULT_WEIGHTS, criterion: weight}

            result = site_analyzer.analyze_point(
                request.lat,
                request.lng,
                request.development_type,
                modified_weights
            )

            sensitivity_results.append({
                "criterion": criterion,
                "weight_variation": weight,
                "result": result.overall_score,
                "suitability_class": result.suitability_class
            })

    # Determine most influential criteria
    influential_criteria = {}
    for res in sensitivity_results:
        criterion = res["criterion"]
        if criterion not in influential_criteria:
            influential_criteria[criterion] = 0
        influential_criteria[criterion] += 1

    most_influential_criteria = sorted(
        influential_criteria.items(),
        key=lambda x: x[1],
        reverse=True
    )[:3]  # Top 3 criteria

    return SensitivityResult(
        base_case=base_result,
        sensitivity_results=sensitivity_results,
        most_influential_criteria=[c[0] for c in most_influential_criteria],
        stability_score=base_result.overall_score - min(
            [r.result for r in sensitivity_results]
        )
    )


@router.get("/criteria")
async def list_criteria():
    """
    Get available suitability criteria with default weights
    """
    criteria = []
    for criterion in SuitabilityCriterion:
        criteria.append({
            "id": criterion.value,
            "name": criterion.value.replace("_", " ").title(),
            "default_weight": DEFAULT_WEIGHTS.get(criterion, 0),
            "description": _get_criterion_description(criterion)
        })

    return {
        "criteria": criteria,
        "suitability_thresholds": SUITABILITY_THRESHOLDS
    }


def _get_criterion_description(criterion: SuitabilityCriterion) -> str:
    """Get description for each criterion"""
    descriptions = {
        SuitabilityCriterion.FLOOD_RISK: "Evaluates proximity to and within flood zones",
        SuitabilityCriterion.BIODIVERSITY: "Checks Critical Biodiversity Areas and ecological corridors",
        SuitabilityCriterion.WETLANDS: "Assesses wetland buffer compliance",
        SuitabilityCriterion.PROTECTED_AREAS: "Checks nature reserves and conservation areas",
        SuitabilityCriterion.ZONING_COMPATIBLE: "Evaluates current zoning compatibility",
        SuitabilityCriterion.ROAD_ACCESS: "Measures distance to road network",
        SuitabilityCriterion.TRANSPORT_ACCESS: "Evaluates public transport accessibility",
        SuitabilityCriterion.UTILITIES_ACCESS: "Checks availability of water, electricity, sewer",
        SuitabilityCriterion.URBAN_EDGE: "Verifies location within urban development boundary",
    }
    return descriptions.get(criterion, "")
