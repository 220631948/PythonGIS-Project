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
    data_source: str = "placeholder"  # "postgis", "arcgis", or "placeholder"


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
    Analyzes site suitability for development based on multiple spatial criteria.

    NOTE: All evaluators currently return placeholder data. Each evaluator
    has a TODO comment identifying the PostGIS layer and query pattern
    needed for real spatial analysis. See individual _eval_* methods.
    """

    # Shared constant for placeholder result identification
    PLACEHOLDER_NOTE = "Placeholder — no spatial query performed"

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
        """Evaluate a single criterion for a location.

        Each evaluator attempts a spatial query against the corresponding
        data layer. If the database is unavailable or the layer is missing,
        a placeholder result is returned with ``data_source="placeholder"``.
        """

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
        try:
            return evaluator(lat, lng, development_type)
        except Exception as e:
            logger.warning(f"Criterion {criterion.value} evaluation failed: {e}")
            result = self._eval_default(lat, lng, development_type)
            result.criterion = criterion.value
            result.data_source = "error"
            result.details["error"] = str(e)
            return result

    def _eval_flood_risk(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate flood risk at location.

        TODO: Wire to PostGIS ST_Intersects query against 'flood_zones' layer
              (MapServer/71 — Stormwater Waterbodies).
              Query: SELECT 1 FROM flood_zones WHERE ST_Intersects(geom, ST_SetSRID(ST_Point(lng,lat),4326))
        """
        # PLACEHOLDER: Returns safe defaults until PostGIS layer is loaded
        logger.debug(f"flood_risk: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="flood_risk",
            score=85,
            weight=0,
            weighted_score=0,
            details={
                "in_flood_zone": False,
                "risk_level": "unknown",
                "flood_return_period": "N/A",
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_biodiversity(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate biodiversity constraints.

        TODO: Wire to PostGIS query against Critical Biodiversity Areas layer.
              Use City of Cape Town Biodiversity Network dataset.
        """
        logger.debug(f"biodiversity: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="biodiversity",
            score=75,
            weight=0,
            weighted_score=0,
            details={
                "in_biodiversity_network": False,
                "classification": "unknown",
                "vegetation_type": "Unknown",
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_wetlands(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate wetland constraints.

        TODO: Wire to PostGIS query against wetlands/waterbodies layer.
              Check ST_DWithin for 32m buffer requirement.
        """
        logger.debug(f"wetlands: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="wetlands",
            score=80,
            weight=0,
            weighted_score=0,
            details={
                "in_wetland": False,
                "buffer_distance_m": None,
                "required_buffer_m": 32,
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_protected_areas(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate protected area constraints.

        TODO: Wire to PostGIS query against 'open_spaces' layer
              (MapServer/212 — Environmental Focus Areas).
        """
        logger.debug(f"protected_areas: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="protected_areas",
            score=90,
            weight=0,
            weighted_score=0,
            details={
                "in_protected_area": False,
                "area_name": None,
                "protection_type": None,
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_zoning(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate zoning compatibility.

        TODO: Wire to PostGIS query against 'zoning' layer
              (MapServer/58 — Zoning). Use ST_Intersects to find
              current zoning classification, then compare with dev_type.
        """
        logger.debug(f"zoning: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="zoning_compatible",
            score=70,
            weight=0,
            weighted_score=0,
            details={
                "current_zoning": "Unknown",
                "compatible_with": dev_type,
                "rezoning_required": None,
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_road_access(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate road access.

        TODO: Wire to PostGIS ST_Distance query against road network layer.
              Calculate distance to nearest classified road.
        """
        logger.debug(f"road_access: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="road_access",
            score=75,
            weight=0,
            weighted_score=0,
            details={
                "distance_to_road_m": None,
                "nearest_road_class": "Unknown",
                "access_quality": "Unknown",
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_transport_access(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate public transport access.

        TODO: Wire to PostGIS ST_Distance query against 'myciti_stops' layer
              (MapServer/96) and 'rail_stations' (MapServer/235).
        """
        logger.debug(f"transport_access: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="transport_access",
            score=65,
            weight=0,
            weighted_score=0,
            details={
                "distance_to_transit_m": None,
                "nearest_transit_type": "Unknown",
                "walking_time_min": None,
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_utilities(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate utilities access.

        TODO: Wire to PostGIS proximity queries against
              'water_facilities' (MapServer/178) and
              'electricity_facilities' (MapServer/176).
        """
        logger.debug(f"utilities: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="utilities_access",
            score=70,
            weight=0,
            weighted_score=0,
            details={
                "water_available": None,
                "electricity_available": None,
                "sewer_available": None,
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_urban_edge(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate urban edge compliance.

        TODO: Wire to PostGIS ST_Intersects query against urban edge boundary.
              City of Cape Town Urban Edge dataset.
        """
        logger.debug(f"urban_edge: placeholder evaluation for ({lat}, {lng})")
        return CriterionResult(
            criterion="urban_edge",
            score=80,
            weight=0,
            weighted_score=0,
            details={
                "within_urban_edge": None,
                "distance_to_edge_m": None,
                "note": self.PLACEHOLDER_NOTE,
            },
            constraints=[],
            data_source="placeholder",
        )

    def _eval_default(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Default evaluator for unknown/unimplemented criteria."""
        return CriterionResult(
            criterion="unknown",
            score=50,
            weight=0,
            weighted_score=0,
            details={"note": "No evaluator implemented for this criterion"},
            constraints=[],
            data_source="placeholder",
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
        _dev_type: str
    ) -> List[str]:
        """Generate recommendations based on analysis results"""
        recommendations = []

        # Warn about placeholder data
        placeholder_count = sum(
            1 for r in criteria if r.data_source == "placeholder"
        )
        if placeholder_count > 0:
            recommendations.append(
                f"⚠️ {placeholder_count}/{len(criteria)} criteria used placeholder data. "
                "Results are indicative only — real spatial analysis requires PostGIS layers."
            )

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

        if len(recommendations) <= 1:
            recommendations.append("Site appears suitable for development pending detailed studies")

        return recommendations


# Singleton analyzer
site_analyzer = SiteSuitabilityAnalyzer()


def get_site_analyzer() -> SiteSuitabilityAnalyzer:
    """Get the site analyzer singleton"""
    return site_analyzer
