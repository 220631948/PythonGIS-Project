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
import re

from sqlalchemy import text

from app.core.database import require_engine

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

    Evaluators attempt PostGIS queries against known Cape Town GeoHub
    spatial tables and gracefully fall back to placeholder values when
    PostGIS is unavailable or specific layers are missing.
    """

    # Shared constant for placeholder result identification
    PLACEHOLDER_NOTE = "Placeholder — no spatial query performed"

    def __init__(self, weights: Optional[Dict[SuitabilityCriterion, float]] = None):
        self.weights = weights or DEFAULT_WEIGHTS
        self._table_cache: Dict[str, bool] = {}

    def _safe_identifier(self, identifier: str) -> str:
        """Validate SQL identifiers used in interpolated table names."""
        if not re.match(r"^[A-Za-z_]\w{0,62}$", identifier):
            raise ValueError(f"Unsafe SQL identifier: {identifier!r}")
        return identifier

    def _run_query_one(
        self,
        query: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Run a SQL query and return the first row as a dict."""
        try:
            engine = require_engine()
            with engine.connect() as conn:
                result = conn.execute(text(query), params or {})
                row = result.first()
                if row is None:
                    return None
                return dict(row._mapping)
        except Exception as exc:
            logger.debug(f"Suitability query failed: {exc}")
            return None

    def _table_exists(self, table_name: str) -> bool:
        """Check if a table exists in public schema, with lightweight cache."""
        table_name = self._safe_identifier(table_name)
        if table_name in self._table_cache:
            return self._table_cache[table_name]

        row = self._run_query_one(
            "SELECT to_regclass(:qualified_name) AS table_ref",
            {"qualified_name": f"public.{table_name}"},
        )
        exists = bool(row and row.get("table_ref"))
        self._table_cache[table_name] = exists
        return exists

    def _resolve_table(self, candidates: List[str]) -> Optional[str]:
        """Return the first existing table from a list of candidates."""
        for candidate in candidates:
            safe_candidate = self._safe_identifier(candidate)
            if self._table_exists(safe_candidate):
                return safe_candidate
        return None

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
        """Evaluate flood risk at location using PostGIS where possible."""
        table_name = self._resolve_table(["flood_zones"])
        if not table_name:
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

        intersection = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT
                COUNT(*)::int AS overlap_count,
                COALESCE(MAX(risk_level), 'unknown') AS risk_level,
                COALESCE(MAX(return_period), 'N/A') AS return_period
            FROM {table_name} f, site
            WHERE f.geom IS NOT NULL
              AND ST_Intersects(f.geom, site.geom)
            """,
            {"lat": lat, "lng": lng},
        )

        distance_row = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT MIN(ST_Distance(f.geom::geography, site.geom::geography)) AS distance_m
            FROM {table_name} f, site
            WHERE f.geom IS NOT NULL
            """,
            {"lat": lat, "lng": lng},
        )

        overlap_count = int((intersection or {}).get("overlap_count") or 0)
        risk_level = str((intersection or {}).get("risk_level") or "unknown").lower()
        return_period = str((intersection or {}).get("return_period") or "N/A")
        nearest_distance = (distance_row or {}).get("distance_m")

        constraints: List[str] = []
        if overlap_count > 0:
            score = {
                "high": 10,
                "medium": 30,
                "low": 55,
            }.get(risk_level, 35)
            if risk_level in {"high", "medium"}:
                constraints.append("Located within flood risk zone")
        else:
            d = float(nearest_distance) if nearest_distance is not None else 10000.0
            if d >= 500:
                score = 92
            elif d >= 250:
                score = 82
            elif d >= 100:
                score = 68
            else:
                score = 52

        return CriterionResult(
            criterion="flood_risk",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "in_flood_zone": overlap_count > 0,
                "risk_level": risk_level,
                "flood_return_period": return_period,
                "nearest_flood_zone_distance_m": None if nearest_distance is None else round(float(nearest_distance), 1),
                "source_table": table_name,
            },
            constraints=constraints,
            data_source="postgis",
        )

    def _eval_biodiversity(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate biodiversity constraints using PostGIS where possible."""
        table_name = self._resolve_table(["biodiversity_areas", "biodiversity_network"])
        if not table_name:
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

        intersection = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT
                COUNT(*)::int AS overlap_count,
                COALESCE(MAX(area_type), MAX(category), 'unknown') AS classification
            FROM {table_name} b, site
            WHERE b.geom IS NOT NULL
              AND ST_Intersects(b.geom, site.geom)
            """,
            {"lat": lat, "lng": lng},
        )

        distance_row = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT MIN(ST_Distance(b.geom::geography, site.geom::geography)) AS distance_m
            FROM {table_name} b, site
            WHERE b.geom IS NOT NULL
            """,
            {"lat": lat, "lng": lng},
        )

        overlap_count = int((intersection or {}).get("overlap_count") or 0)
        classification = str((intersection or {}).get("classification") or "unknown")
        nearest_distance = (distance_row or {}).get("distance_m")

        constraints: List[str] = []
        if overlap_count > 0:
            class_norm = classification.lower()
            if any(flag in class_norm for flag in ["cba", "critical", "protected"]):
                score = 15
                constraints.append("Within critical biodiversity area")
            else:
                score = 35
                constraints.append("Within biodiversity network")
        else:
            d = float(nearest_distance) if nearest_distance is not None else 10000.0
            if d >= 1000:
                score = 90
            elif d >= 500:
                score = 78
            elif d >= 250:
                score = 65
            else:
                score = 52

        return CriterionResult(
            criterion="biodiversity",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "in_biodiversity_network": overlap_count > 0,
                "classification": classification,
                "vegetation_type": "Unknown",
                "nearest_biodiversity_area_distance_m": None if nearest_distance is None else round(float(nearest_distance), 1),
                "source_table": table_name,
            },
            constraints=constraints,
            data_source="postgis",
        )

    def _eval_wetlands(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate wetland constraints using PostGIS where possible."""
        table_name = self._resolve_table(["wetlands", "waterbodies"])
        if not table_name:
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

        required_buffer = 32.0
        overlap_row = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT COUNT(*)::int AS overlap_count
            FROM {table_name} w, site
            WHERE w.geom IS NOT NULL
              AND ST_Intersects(w.geom, site.geom)
            """,
            {"lat": lat, "lng": lng},
        )

        distance_row = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT MIN(ST_Distance(w.geom::geography, site.geom::geography)) AS distance_m
            FROM {table_name} w, site
            WHERE w.geom IS NOT NULL
            """,
            {"lat": lat, "lng": lng},
        )

        in_wetland = int((overlap_row or {}).get("overlap_count") or 0) > 0
        nearest_distance = (distance_row or {}).get("distance_m")
        constraints: List[str] = []

        if in_wetland:
            score = 0
            constraints.append("Inside wetland area")
        else:
            d = float(nearest_distance) if nearest_distance is not None else 10000.0
            if d >= required_buffer:
                score = 90
            elif d > 0:
                score = max(10, round((d / required_buffer) * 80, 1))
                constraints.append(f"Wetland buffer non-compliant (< {required_buffer:.0f}m)")
            else:
                score = 10
                constraints.append(f"Wetland buffer non-compliant (< {required_buffer:.0f}m)")

        return CriterionResult(
            criterion="wetlands",
            score=float(score),
            weight=0,
            weighted_score=0,
            details={
                "in_wetland": in_wetland,
                "buffer_distance_m": None if nearest_distance is None else round(float(nearest_distance), 1),
                "required_buffer_m": required_buffer,
                "source_table": table_name,
            },
            constraints=constraints,
            data_source="postgis",
        )

    def _eval_protected_areas(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate protected/open-space constraints using PostGIS where possible."""
        table_name = self._resolve_table(["open_spaces", "protected_areas"])
        if not table_name:
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

        intersection = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT
                COUNT(*)::int AS overlap_count,
                COALESCE(MAX(name), 'Unknown area') AS area_name,
                COALESCE(MAX(area_type), MAX(category), 'protected') AS protection_type
            FROM {table_name} p, site
            WHERE p.geom IS NOT NULL
              AND ST_Intersects(p.geom, site.geom)
            """,
            {"lat": lat, "lng": lng},
        )

        distance_row = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT MIN(ST_Distance(p.geom::geography, site.geom::geography)) AS distance_m
            FROM {table_name} p, site
            WHERE p.geom IS NOT NULL
            """,
            {"lat": lat, "lng": lng},
        )

        overlap_count = int((intersection or {}).get("overlap_count") or 0)
        area_name = (intersection or {}).get("area_name")
        protection_type = (intersection or {}).get("protection_type")
        nearest_distance = (distance_row or {}).get("distance_m")
        constraints: List[str] = []

        if overlap_count > 0:
            score = 12
            constraints.append("Inside protected/open-space area")
        else:
            d = float(nearest_distance) if nearest_distance is not None else 10000.0
            if d >= 1000:
                score = 90
            elif d >= 300:
                score = 75
            else:
                score = 58

        return CriterionResult(
            criterion="protected_areas",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "in_protected_area": overlap_count > 0,
                "area_name": area_name,
                "protection_type": protection_type,
                "nearest_protected_area_distance_m": None if nearest_distance is None else round(float(nearest_distance), 1),
                "source_table": table_name,
            },
            constraints=constraints,
            data_source="postgis",
        )

    def _eval_zoning(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate zoning compatibility using PostGIS where possible."""
        table_name = self._resolve_table(["zoning_areas", "zoning"])
        if not table_name:
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

        zoning_row = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT
                COALESCE(zone_type, zone_code, zone_name, 'Unknown') AS zoning
            FROM {table_name} z, site
            WHERE z.geom IS NOT NULL
              AND ST_Intersects(z.geom, site.geom)
            LIMIT 1
            """,
            {"lat": lat, "lng": lng},
        )

        current_zoning = str((zoning_row or {}).get("zoning") or "Unknown")
        zone_norm = current_zoning.lower()
        dev_norm = dev_type.lower()

        compatibility_keywords = {
            "residential": ["residential", "single", "general residential", "gr"],
            "commercial": ["commercial", "business", "mixed", "industrial"],
            "industrial": ["industrial", "general industry", "heavy industry"],
            "mixed_use": ["mixed", "commercial", "business", "residential"],
            "institutional": ["institutional", "community", "public", "civic"],
            "recreational": ["open", "recreation", "park", "sports"],
        }

        is_compatible = any(
            token in zone_norm for token in compatibility_keywords.get(dev_norm, [])
        )

        if current_zoning == "Unknown":
            score = 50
            rezoning_required = None
            constraints: List[str] = []
        elif is_compatible:
            score = 90
            rezoning_required = False
            constraints = []
        else:
            score = 30
            rezoning_required = True
            constraints = [f"Current zoning may not permit {dev_type} development"]

        return CriterionResult(
            criterion="zoning_compatible",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "current_zoning": current_zoning,
                "compatible_with": dev_type,
                "rezoning_required": rezoning_required,
                "source_table": table_name,
            },
            constraints=constraints,
            data_source="postgis",
        )

    def _eval_road_access(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate road access via nearest-road PostGIS query."""
        table_name = self._resolve_table(["roads", "road_network"])
        if not table_name:
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

        nearest = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT
                ST_Distance(r.geom::geography, site.geom::geography) AS distance_m,
                COALESCE(r.road_class, r.road_type, 'Unknown') AS road_class
            FROM {table_name} r, site
            WHERE r.geom IS NOT NULL
            ORDER BY r.geom <-> site.geom
            LIMIT 1
            """,
            {"lat": lat, "lng": lng},
        )

        if not nearest:
            return CriterionResult(
                criterion="road_access",
                score=50,
                weight=0,
                weighted_score=0,
                details={
                    "distance_to_road_m": None,
                    "nearest_road_class": "Unknown",
                    "access_quality": "Unknown",
                    "source_table": table_name,
                },
                constraints=["Road network data unavailable for nearest-point calculation"],
                data_source="postgis",
            )

        distance_m = float(nearest.get("distance_m") or 0.0)
        road_class = str(nearest.get("road_class") or "Unknown")

        if distance_m <= 100:
            score = 95
            access_quality = "Excellent"
        elif distance_m <= 250:
            score = 82
            access_quality = "Good"
        elif distance_m <= 500:
            score = 68
            access_quality = "Moderate"
        elif distance_m <= 1000:
            score = 48
            access_quality = "Poor"
        else:
            score = 28
            access_quality = "Very Poor"

        constraints = ["Limited road accessibility"] if distance_m > 1500 else []

        return CriterionResult(
            criterion="road_access",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "distance_to_road_m": round(distance_m, 1),
                "nearest_road_class": road_class,
                "access_quality": access_quality,
                "source_table": table_name,
            },
            constraints=constraints,
            data_source="postgis",
        )

    def _eval_transport_access(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate public transport access via nearest-stop PostGIS query."""
        table_name = self._resolve_table(["transport_stops", "myciti_stops", "rail_stations"])
        if not table_name:
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

        transit_type_expr = "COALESCE(stop_type, 'unknown')"
        if table_name in {"myciti_stops", "rail_stations"}:
            transit_type_expr = "'stop'"

        nearest = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT
                ST_Distance(t.geom::geography, site.geom::geography) AS distance_m,
                {transit_type_expr} AS transit_type
            FROM {table_name} t, site
            WHERE t.geom IS NOT NULL
            ORDER BY t.geom <-> site.geom
            LIMIT 1
            """,
            {"lat": lat, "lng": lng},
        )

        if not nearest:
            return CriterionResult(
                criterion="transport_access",
                score=40,
                weight=0,
                weighted_score=0,
                details={
                    "distance_to_transit_m": None,
                    "nearest_transit_type": "Unknown",
                    "walking_time_min": None,
                    "source_table": table_name,
                },
                constraints=["No transport stop records available"],
                data_source="postgis",
            )

        distance_m = float(nearest.get("distance_m") or 0.0)
        transit_type = str(nearest.get("transit_type") or "unknown")
        walking_time_min = round(distance_m / 80.0, 1)  # ~80m/min walk speed

        if distance_m <= 300:
            score = 95
        elif distance_m <= 600:
            score = 80
        elif distance_m <= 1000:
            score = 64
        elif distance_m <= 2000:
            score = 45
        else:
            score = 25

        constraints = ["Low public transport accessibility"] if distance_m > 1500 else []

        return CriterionResult(
            criterion="transport_access",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "distance_to_transit_m": round(distance_m, 1),
                "nearest_transit_type": transit_type,
                "walking_time_min": walking_time_min,
                "source_table": table_name,
            },
            constraints=constraints,
            data_source="postgis",
        )

    def _eval_utilities(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate utilities access via nearest facility queries."""
        service_table = self._resolve_table(["service_facilities"])
        if not service_table:
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

        utility_distances = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT
                MIN(CASE WHEN lower(sf.facility_type) = 'water_facility'
                    THEN ST_Distance(sf.geom::geography, site.geom::geography) END) AS water_distance_m,
                MIN(CASE WHEN lower(sf.facility_type) = 'electricity_facility'
                    THEN ST_Distance(sf.geom::geography, site.geom::geography) END) AS electricity_distance_m
            FROM {service_table} sf, site
            WHERE sf.geom IS NOT NULL
            """,
            {"lat": lat, "lng": lng},
        )

        if utility_distances is None:
            return CriterionResult(
                criterion="utilities_access",
                score=45,
                weight=0,
                weighted_score=0,
                details={
                    "water_available": None,
                    "electricity_available": None,
                    "sewer_available": None,
                    "source_table": service_table,
                },
                constraints=["Utility proximity query failed"],
                data_source="postgis",
            )

        water_distance = utility_distances.get("water_distance_m")
        electricity_distance = utility_distances.get("electricity_distance_m")

        water_available = water_distance is not None and float(water_distance) <= 1000
        electricity_available = electricity_distance is not None and float(electricity_distance) <= 1000
        sewer_available = None  # No dedicated sewer dataset wired yet

        score = 30
        if water_available:
            score += 30
        elif water_distance is not None and float(water_distance) <= 2000:
            score += 15

        if electricity_available:
            score += 30
        elif electricity_distance is not None and float(electricity_distance) <= 2000:
            score += 15

        constraints: List[str] = []
        if not water_available:
            constraints.append("Limited proximity to water facilities")
        if not electricity_available:
            constraints.append("Limited proximity to electricity facilities")

        return CriterionResult(
            criterion="utilities_access",
            score=float(min(score, 100)),
            weight=0,
            weighted_score=0,
            details={
                "water_available": water_available,
                "electricity_available": electricity_available,
                "sewer_available": sewer_available,
                "distance_to_water_m": None if water_distance is None else round(float(water_distance), 1),
                "distance_to_electricity_m": None if electricity_distance is None else round(float(electricity_distance), 1),
                "source_table": service_table,
            },
            constraints=constraints,
            data_source="postgis",
        )

    def _eval_urban_edge(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate urban edge compliance using PostGIS where possible."""
        table_name = self._resolve_table(["urban_edge"])
        if not table_name:
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

        containment = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT COUNT(*)::int AS overlap_count
            FROM {table_name} u, site
            WHERE u.geom IS NOT NULL
              AND ST_Intersects(u.geom, site.geom)
            """,
            {"lat": lat, "lng": lng},
        )

        distance_row = self._run_query_one(
            f"""
            WITH site AS (SELECT ST_SetSRID(ST_Point(:lng, :lat), 4326) AS geom)
            SELECT MIN(ST_Distance(u.geom::geography, site.geom::geography)) AS distance_m
            FROM {table_name} u, site
            WHERE u.geom IS NOT NULL
            """,
            {"lat": lat, "lng": lng},
        )

        within_edge = int((containment or {}).get("overlap_count") or 0) > 0
        edge_distance = (distance_row or {}).get("distance_m")

        if within_edge:
            score = 90
            constraints: List[str] = []
        else:
            score = 25
            constraints = ["Outside designated urban edge"]

        return CriterionResult(
            criterion="urban_edge",
            score=score,
            weight=0,
            weighted_score=0,
            details={
                "within_urban_edge": within_edge,
                "distance_to_edge_m": None if edge_distance is None else round(float(edge_distance), 1),
                "source_table": table_name,
            },
            constraints=constraints,
            data_source="postgis",
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
