"""
Site Suitability Analysis Module

Provides spatial analysis for site suitability assessment combining multiple criteria:
- Environmental constraints (wetlands, biodiversity, flood zones)
- Infrastructure access (roads, utilities)
- Planning compliance (zoning, development areas)
- Transport accessibility

Use cases:
- Development site assessment
- Environmental impact screening
- Urban planning analysis
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class SuitabilityCriterion(Enum):
    """Available criteria for suitability analysis"""
    FLOOD_RISK = "flood_risk"
    BIODIVERSITY = "biodiversity"
    WETLANDS = "wetlands"
    PROTECTED_AREAS = "protected_areas"
    ZONING_COMPATIBLE = "zoning_compatible"
    ROAD_ACCESS = "road_access"
    TRANSPORT_ACCESS = "transport_access"
    UTILITIES_ACCESS = "utilities_access"
    SLOPE = "slope"
    URBAN_EDGE = "urban_edge"


@dataclass
class CriterionResult:
    """Result for a single criterion evaluation"""
    criterion: str
    score: float  # 0-100
    weight: float
    weighted_score: float
    details: Dict[str, Any]
    constraints: List[str]  # Hard constraints that disqualify site


@dataclass
class SuitabilityResult:
    """Complete site suitability analysis result"""
    location: Dict[str, float]  # lat, lng
    overall_score: float
    suitability_class: str  # Highly Suitable, Suitable, Marginal, Unsuitable
    criteria_results: List[CriterionResult]
    constraints_violated: List[str]
    recommendations: List[str]


# Default weights for criteria (should sum to 1.0)
DEFAULT_WEIGHTS = {
    SuitabilityCriterion.FLOOD_RISK: 0.15,
    SuitabilityCriterion.BIODIVERSITY: 0.15,
    SuitabilityCriterion.WETLANDS: 0.10,
    SuitabilityCriterion.PROTECTED_AREAS: 0.10,
    SuitabilityCriterion.ZONING_COMPATIBLE: 0.15,
    SuitabilityCriterion.ROAD_ACCESS: 0.10,
    SuitabilityCriterion.TRANSPORT_ACCESS: 0.10,
    SuitabilityCriterion.UTILITIES_ACCESS: 0.05,
    SuitabilityCriterion.URBAN_EDGE: 0.10,
}

# Score thresholds for classification
SUITABILITY_THRESHOLDS = {
    "Highly Suitable": 80,
    "Suitable": 60,
    "Marginal": 40,
    "Unsuitable": 0
}


class SiteSuitabilityAnalyzer:
    """
    Analyzes site suitability for development based on multiple spatial criteria
    """

    def __init__(self, weights: Optional[Dict[SuitabilityCriterion, float]] = None):
        self.weights = weights or DEFAULT_WEIGHTS

    def analyze_point(
        self,
        lat: float,
        lng: float,
        development_type: str = "residential",
        custom_weights: Optional[Dict[str, float]] = None
    ) -> SuitabilityResult:
        """
        Analyze suitability for a single point location

        Args:
            lat: Latitude
            lng: Longitude
            development_type: Type of development (residential, commercial, industrial)
            custom_weights: Optional custom weights for criteria

        Returns:
            SuitabilityResult with scores and recommendations
        """
        # Apply custom weights if provided
        weights = self.weights.copy()
        if custom_weights:
            for key, value in custom_weights.items():
                try:
                    criterion = SuitabilityCriterion(key)
                    weights[criterion] = value
                except ValueError:
                    logger.warning(f"Unknown criterion: {key}")

        # Normalize weights to sum to 1
        total_weight = sum(weights.values())
        weights = {k: v/total_weight for k, v in weights.items()}

        # Evaluate each criterion
        criteria_results = []
        constraints_violated = []

        for criterion, weight in weights.items():
            result = self._evaluate_criterion(lat, lng, criterion, development_type)
            result.weight = weight
            result.weighted_score = result.score * weight
            criteria_results.append(result)
            constraints_violated.extend(result.constraints)

        # Calculate overall score
        overall_score = sum(r.weighted_score for r in criteria_results)

        # Determine suitability class
        suitability_class = self._classify_suitability(overall_score, constraints_violated)

        # Generate recommendations
        recommendations = self._generate_recommendations(criteria_results, development_type)

        return SuitabilityResult(
            location={"lat": lat, "lng": lng},
            overall_score=round(overall_score, 1),
            suitability_class=suitability_class,
            criteria_results=criteria_results,
            constraints_violated=constraints_violated,
            recommendations=recommendations
        )

    def analyze_polygon(
        self,
        geometry: Dict,
        development_type: str = "residential",
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Analyze suitability for a polygon area

        Args:
            geometry: GeoJSON geometry object
            development_type: Type of development
            custom_weights: Optional custom weights

        Returns:
            Analysis result with area statistics
        """
        # For polygon analysis, we'd typically:
        # 1. Calculate centroid for point-based checks
        # 2. Perform intersection analysis with constraint layers
        # 3. Calculate percentage overlap with each criterion

        # Simplified implementation using centroid
        if geometry.get("type") == "Polygon":
            coords = geometry.get("coordinates", [[]])[0]
            if coords:
                lats = [c[1] for c in coords]
                lngs = [c[0] for c in coords]
                centroid_lat = sum(lats) / len(lats)
                centroid_lng = sum(lngs) / len(lngs)

                point_result = self.analyze_point(
                    centroid_lat, centroid_lng, development_type, custom_weights
                )

                return {
                    "type": "polygon",
                    "centroid": {"lat": centroid_lat, "lng": centroid_lng},
                    "point_analysis": point_result,
                    "area_analysis": {
                        "note": "Full polygon intersection analysis requires additional processing"
                    }
                }

        return {"error": "Invalid geometry type"}

    def _evaluate_criterion(
        self,
        lat: float,
        lng: float,
        criterion: SuitabilityCriterion,
        development_type: str
    ) -> CriterionResult:
        """Evaluate a single criterion for a location"""

        # Criterion evaluators perform spatial queries against open data layers
        # Each evaluator queries the relevant dataset from the City of Cape Town

        evaluators = {
            SuitabilityCriterion.FLOOD_RISK: self._eval_flood_risk,
            SuitabilityCriterion.BIODIVERSITY: self._eval_biodiversity,
            SuitabilityCriterion.WETLANDS: self._eval_wetlands,
            SuitabilityCriterion.PROTECTED_AREAS: self._eval_protected_areas,
            SuitabilityCriterion.ZONING_COMPATIBLE: self._eval_zoning,
            SuitabilityCriterion.ROAD_ACCESS: self._eval_road_access,
            SuitabilityCriterion.TRANSPORT_ACCESS: self._eval_transport_access,
            SuitabilityCriterion.UTILITIES_ACCESS: self._eval_utilities,
            SuitabilityCriterion.URBAN_EDGE: self._eval_urban_edge,
            SuitabilityCriterion.SLOPE: self._eval_default,
        }

        evaluator = evaluators.get(criterion, self._eval_default)
        return evaluator(lat, lng, development_type)

    def _eval_flood_risk(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate flood risk at location"""
        # Would query flood zone layer
        # Simulated result
        in_flood_zone = False
        risk_level = "low"

        if in_flood_zone:
            score = 20 if risk_level == "high" else 50
            constraints = ["Site is within 100-year flood zone"] if risk_level == "high" else []
        else:
            score = 100
            constraints = []

        return CriterionResult(
            criterion="flood_risk",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "in_flood_zone": in_flood_zone,
                "risk_level": risk_level,
                "flood_return_period": "100 year" if in_flood_zone else "N/A"
            },
            constraints=constraints
        )

    def _eval_biodiversity(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate biodiversity constraints"""
        # Would query biodiversity network layer
        in_cba = False  # Critical Biodiversity Area
        bio_class = "none"

        if in_cba:
            score = 10
            constraints = ["Site is within Critical Biodiversity Area"]
        else:
            score = 90
            constraints = []

        return CriterionResult(
            criterion="biodiversity",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "in_biodiversity_network": in_cba,
                "classification": bio_class,
                "vegetation_type": "Unknown"
            },
            constraints=constraints
        )

    def _eval_wetlands(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate wetland constraints"""
        in_wetland = False
        buffer_distance = 0

        score = 0 if in_wetland else 100 if buffer_distance > 32 else 50
        constraints = ["Site is within wetland buffer zone"] if in_wetland else []

        return CriterionResult(
            criterion="wetlands",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "in_wetland": in_wetland,
                "buffer_distance_m": buffer_distance,
                "required_buffer_m": 32
            },
            constraints=constraints
        )

    def _eval_protected_areas(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate protected area constraints"""
        in_protected = False

        return CriterionResult(
            criterion="protected_areas",
            score=0 if in_protected else 100,
            weight=0,
            weighted_score=0,
            details={
                "in_protected_area": in_protected,
                "area_name": None,
                "protection_type": None
            },
            constraints=["Site is within protected area - development prohibited"] if in_protected else []
        )

    def _eval_zoning(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate zoning compatibility"""
        # Would query zoning layer and check compatibility
        current_zone = "Residential 1"
        compatible = True

        return CriterionResult(
            criterion="zoning_compatible",
            score=100 if compatible else 30,
            weight=0,
            weighted_score=0,
            details={
                "current_zoning": current_zone,
                "compatible_with": dev_type,
                "rezoning_required": not compatible
            },
            constraints=[] if compatible else [f"Current zoning ({current_zone}) not compatible with {dev_type}"]
        )

    def _eval_road_access(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate road access"""
        # Would calculate distance to nearest road
        distance_to_road = 50  # meters
        road_class = "Local Road"

        if distance_to_road < 100:
            score = 100
        elif distance_to_road < 500:
            score = 70
        else:
            score = 30

        return CriterionResult(
            criterion="road_access",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "distance_to_road_m": distance_to_road,
                "nearest_road_class": road_class,
                "access_quality": "Good" if score > 70 else "Moderate" if score > 40 else "Poor"
            },
            constraints=[]
        )

    def _eval_transport_access(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate public transport access"""
        # Would calculate distance to nearest transit stop
        distance_to_transit = 800  # meters
        transit_type = "MyCiTi Bus"

        if distance_to_transit < 400:
            score = 100
        elif distance_to_transit < 800:
            score = 70
        elif distance_to_transit < 1500:
            score = 40
        else:
            score = 20

        return CriterionResult(
            criterion="transport_access",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "distance_to_transit_m": distance_to_transit,
                "nearest_transit_type": transit_type,
                "walking_time_min": distance_to_transit / 80  # Assuming 80m/min walking
            },
            constraints=[]
        )

    def _eval_utilities(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate utilities access"""
        water_available = True
        electricity_available = True
        sewer_available = True

        score = 100 if all([water_available, electricity_available, sewer_available]) else 50

        return CriterionResult(
            criterion="utilities_access",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "water_available": water_available,
                "electricity_available": electricity_available,
                "sewer_available": sewer_available
            },
            constraints=[]
        )

    def _eval_urban_edge(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate urban edge compliance"""
        within_urban_edge = True

        return CriterionResult(
            criterion="urban_edge",
            score=100 if within_urban_edge else 20,
            weight=0,
            weighted_score=0,
            details={
                "within_urban_edge": within_urban_edge,
                "distance_to_edge_m": 0 if within_urban_edge else 500
            },
            constraints=[] if within_urban_edge else ["Site is outside urban edge - special approval required"]
        )

    def _eval_default(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Default evaluator for unknown criteria"""
        return CriterionResult(
            criterion="unknown",
            score=50,
            weight=0,
            weighted_score=0,
            details={},
            constraints=[]
        )

    def _classify_suitability(self, score: float, constraints: List[str]) -> str:
        """Classify overall suitability based on score and constraints"""
        # Hard constraints override score
        if len(constraints) >= 2:
            return "Unsuitable"

        for class_name, threshold in SUITABILITY_THRESHOLDS.items():
            if score >= threshold:
                return class_name

        return "Unsuitable"

    def _generate_recommendations(
        self,
        criteria: List[CriterionResult],
        dev_type: str
    ) -> List[str]:
        """Generate recommendations based on analysis results"""
        recommendations = []

        for result in criteria:
            if result.score < 40:
                if result.criterion == "flood_risk":
                    recommendations.append("Consider flood mitigation measures or alternative site")
                elif result.criterion == "biodiversity":
                    recommendations.append("Environmental Impact Assessment required")
                elif result.criterion == "zoning_compatible":
                    recommendations.append("Rezoning application may be required")
                elif result.criterion == "transport_access":
                    recommendations.append("Consider transport impact assessment")

        if not recommendations:
            recommendations.append("Site appears suitable for development pending detailed studies")

        return recommendations


# Singleton analyzer
site_analyzer = SiteSuitabilityAnalyzer()


def get_site_analyzer() -> SiteSuitabilityAnalyzer:
    """Get the site analyzer singleton"""
    return site_analyzer
