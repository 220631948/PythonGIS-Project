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

import asyncio
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.shape import to_shape

from app.core.database import get_engine, DatabaseConnectionError

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

    All evaluators attempt PostGIS spatial queries when database is available,
    falling back to placeholder data when database is unavailable or query fails.
    """

    # Shared constant for placeholder result identification
    PLACEHOLDER_NOTE = "Placeholder — no spatial query performed"

    def __init__(self, weights: Optional[Dict[SuitabilityCriterion, float]] = None):
        self.weights = weights or DEFAULT_WEIGHTS
    
    def _run_async_query(self, coro):
        """
        Helper to run async queries from sync context.
        Handles event loop management properly.
        """
        try:
            # Check if we're already in an async context
            loop = asyncio.get_running_loop()
            # If we get here, we're in an async context - can't use asyncio.run
            # Use run_until_complete instead
            return loop.run_until_complete(coro)
        except RuntimeError:
            # No running loop - safe to use asyncio.run
            return asyncio.run(coro)

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

        Uses PostGIS ST_Intersects query against 'flood_zones' table
        (MapServer/71 — Stormwater Waterbodies).
        """
        try:
            result = self._run_async_query(self._query_flood_risk(lat, lng))
            
            if result is None:
                # No data available, return placeholder
                logger.debug(f"flood_risk: no PostGIS data for ({lat}, {lng})")
                return self._flood_risk_placeholder()
            
            in_flood_zone = result.get("in_flood_zone", False)
            risk_level = result.get("risk_level", "unknown")
            return_period = result.get("return_period", "N/A")
            
            # Score based on flood risk (lower score for higher risk)
            if in_flood_zone:
                score_map = {
                    "high": 15,
                    "medium": 45,
                    "low": 70
                }
                score = score_map.get(risk_level.lower(), 30)
                constraints = ["Site located in flood zone - flood mitigation required"]
            else:
                score = 95
                constraints = []
            
            return CriterionResult(
                criterion="flood_risk",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "in_flood_zone": in_flood_zone,
                    "risk_level": risk_level,
                    "flood_return_period": return_period,
                    "data_source": "PostGIS - City of Cape Town Stormwater Waterbodies"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Flood risk evaluation failed: {e}")
            return self._flood_risk_placeholder()
    
    def _flood_risk_placeholder(self) -> CriterionResult:
        """Fallback placeholder for flood risk."""
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
    
    async def _query_flood_risk(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Query PostGIS for flood zone intersection."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                query = text("""
                    SELECT 
                        zone_id,
                        risk_level,
                        return_period,
                        description
                    FROM flood_zones
                    WHERE ST_Intersects(
                        geom,
                        ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    )
                    LIMIT 1
                """)
                
                result = await conn.execute(query, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "in_flood_zone": True,
                        "zone_id": row[0],
                        "risk_level": row[1] or "unknown",
                        "return_period": row[2] or "N/A",
                        "description": row[3]
                    }
                else:
                    return {
                        "in_flood_zone": False,
                        "risk_level": "none",
                        "return_period": "N/A"
                    }
        except DatabaseConnectionError:
            logger.debug("Database not available for flood risk query")
            return None
        except Exception as e:
            logger.error(f"Error querying flood zones: {e}")
            return None

    def _eval_biodiversity(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate biodiversity constraints.

        Uses PostGIS query against Critical Biodiversity Areas layer
        (biodiversity_areas table).
        """
        try:
            result = self._run_async_query(self._query_biodiversity(lat, lng))
            
            if result is None:
                logger.debug(f"biodiversity: no PostGIS data for ({lat}, {lng})")
                return self._biodiversity_placeholder()
            
            in_biodiversity_network = result.get("in_network", False)
            classification = result.get("area_type", "unknown")
            
            # Score based on biodiversity classification
            # CBA (Critical Biodiversity Area) = critical, ESA (Ecological Support Area) = medium
            if in_biodiversity_network:
                score_map = {
                    "cba": 20,  # Critical - very low score
                    "critical": 20,
                    "esa": 50,  # Ecological Support
                    "support": 50,
                    "pa": 10,  # Protected Area - lowest score
                    "protected": 10
                }
                score = score_map.get(classification.lower(), 35)
                constraints = [f"Site within {classification} biodiversity area - Environmental Impact Assessment required"]
            else:
                score = 90
                constraints = []
            
            return CriterionResult(
                criterion="biodiversity",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "in_biodiversity_network": in_biodiversity_network,
                    "classification": classification,
                    "vegetation_type": result.get("vegetation_type", "Unknown"),
                    "data_source": "PostGIS - City of Cape Town Biodiversity Network"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Biodiversity evaluation failed: {e}")
            return self._biodiversity_placeholder()
    
    def _biodiversity_placeholder(self) -> CriterionResult:
        """Fallback placeholder for biodiversity."""
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
    
    async def _query_biodiversity(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Query PostGIS for biodiversity area intersection."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                query = text("""
                    SELECT 
                        name,
                        area_type,
                        category,
                        status
                    FROM biodiversity_areas
                    WHERE ST_Intersects(
                        geom,
                        ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    )
                    ORDER BY 
                        CASE area_type
                            WHEN 'PA' THEN 1
                            WHEN 'CBA' THEN 2
                            WHEN 'ESA' THEN 3
                            ELSE 4
                        END
                    LIMIT 1
                """)
                
                result = await conn.execute(query, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "in_network": True,
                        "name": row[0],
                        "area_type": row[1] or "unknown",
                        "vegetation_type": row[2] or "Unknown",
                        "status": row[3]
                    }
                else:
                    return {
                        "in_network": False,
                        "area_type": "none",
                        "vegetation_type": "N/A"
                    }
        except DatabaseConnectionError:
            logger.debug("Database not available for biodiversity query")
            return None
        except Exception as e:
            logger.error(f"Error querying biodiversity areas: {e}")
            return None

    def _eval_wetlands(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate wetland constraints.

        Uses PostGIS query against wetlands/waterbodies layer with 32m buffer.
        Checks ST_DWithin for 32m buffer requirement (NEMA regulations).
        """
        try:
            result = self._run_async_query(self._query_wetlands(lat, lng))
            
            if result is None:
                logger.debug(f"wetlands: no PostGIS data for ({lat}, {lng})")
                return self._wetlands_placeholder()
            
            in_wetland = result.get("in_wetland", False)
            buffer_distance = result.get("distance_m")
            required_buffer = 32  # NEMA 32m buffer
            
            # Score based on proximity to wetlands
            if in_wetland:
                score = 10
                constraints = ["Site within wetland - development prohibited"]
            elif buffer_distance and buffer_distance < required_buffer:
                score = 30
                constraints = [f"Site within {required_buffer}m wetland buffer - restrictions apply"]
            elif buffer_distance and buffer_distance < 100:
                score = 60
                constraints = []
            else:
                score = 95
                constraints = []
            
            return CriterionResult(
                criterion="wetlands",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "in_wetland": in_wetland,
                    "buffer_distance_m": buffer_distance,
                    "required_buffer_m": required_buffer,
                    "wetland_type": result.get("wetland_type", "N/A"),
                    "data_source": "PostGIS - City of Cape Town Wetlands"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Wetlands evaluation failed: {e}")
            return self._wetlands_placeholder()
    
    def _wetlands_placeholder(self) -> CriterionResult:
        """Fallback placeholder for wetlands."""
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
    
    async def _query_wetlands(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Query PostGIS for wetland proximity."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                # First check if point is within wetland
                query_intersect = text("""
                    SELECT 
                        name,
                        wetland_type,
                        status
                    FROM wetlands
                    WHERE ST_Intersects(
                        geom,
                        ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    )
                    LIMIT 1
                """)
                
                result = await conn.execute(query_intersect, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "in_wetland": True,
                        "wetland_name": row[0],
                        "wetland_type": row[1] or "Unknown",
                        "status": row[2],
                        "distance_m": 0
                    }
                
                # If not inside, calculate distance to nearest wetland
                query_distance = text("""
                    SELECT 
                        name,
                        wetland_type,
                        ST_Distance(
                            ST_Transform(geom, 32734),
                            ST_Transform(ST_SetSRID(ST_Point(:lng, :lat), 4326), 32734)
                        ) as distance_m
                    FROM wetlands
                    ORDER BY geom <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    LIMIT 1
                """)
                
                result = await conn.execute(query_distance, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "in_wetland": False,
                        "wetland_name": row[0],
                        "wetland_type": row[1] or "Unknown",
                        "distance_m": round(row[2], 1)
                    }
                else:
                    return {
                        "in_wetland": False,
                        "distance_m": None
                    }
        except DatabaseConnectionError:
            logger.debug("Database not available for wetlands query")
            return None
        except Exception as e:
            logger.error(f"Error querying wetlands: {e}")
            return None

    def _eval_protected_areas(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate protected area constraints.

        Uses PostGIS query to check proximity to parks, nature reserves, and open spaces.
        Protected areas are often stored in biodiversity_areas or service_facilities tables.
        """
        try:
            result = self._run_async_query(self._query_protected_areas(lat, lng))
            
            if result is None:
                logger.debug(f"protected_areas: no PostGIS data for ({lat}, {lng})")
                return self._protected_areas_placeholder()
            
            in_protected_area = result.get("in_protected_area", False)
            distance_m = result.get("distance_m")
            
            # Score based on proximity to protected areas
            if in_protected_area:
                score = 5
                constraints = ["Site within protected area - development prohibited"]
            elif distance_m and distance_m < 100:
                score = 40
                constraints = ["Site near protected area - impact assessment required"]
            elif distance_m and distance_m < 500:
                score = 75  # Close to open space - good for residential
                constraints = []
            else:
                score = 85
                constraints = []
            
            return CriterionResult(
                criterion="protected_areas",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "in_protected_area": in_protected_area,
                    "area_name": result.get("area_name"),
                    "protection_type": result.get("protection_type"),
                    "distance_m": distance_m,
                    "data_source": "PostGIS - City of Cape Town Protected Areas"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Protected areas evaluation failed: {e}")
            return self._protected_areas_placeholder()
    
    def _protected_areas_placeholder(self) -> CriterionResult:
        """Fallback placeholder for protected areas."""
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
    
    async def _query_protected_areas(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Query PostGIS for protected area proximity."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                # Check if point is within protected area (using biodiversity_areas where area_type = 'PA')
                query_intersect = text("""
                    SELECT 
                        name,
                        area_type,
                        status
                    FROM biodiversity_areas
                    WHERE area_type IN ('PA', 'Protected', 'protected')
                        AND ST_Intersects(
                            geom,
                            ST_SetSRID(ST_Point(:lng, :lat), 4326)
                        )
                    LIMIT 1
                """)
                
                result = await conn.execute(query_intersect, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "in_protected_area": True,
                        "area_name": row[0],
                        "protection_type": row[1],
                        "status": row[2],
                        "distance_m": 0
                    }
                
                # Calculate distance to nearest protected area
                query_distance = text("""
                    SELECT 
                        name,
                        area_type,
                        ST_Distance(
                            ST_Transform(geom, 32734),
                            ST_Transform(ST_SetSRID(ST_Point(:lng, :lat), 4326), 32734)
                        ) as distance_m
                    FROM biodiversity_areas
                    WHERE area_type IN ('PA', 'Protected', 'protected')
                    ORDER BY geom <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    LIMIT 1
                """)
                
                result = await conn.execute(query_distance, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "in_protected_area": False,
                        "area_name": row[0],
                        "protection_type": row[1],
                        "distance_m": round(row[2], 1)
                    }
                else:
                    return {
                        "in_protected_area": False,
                        "distance_m": None
                    }
        except DatabaseConnectionError:
            logger.debug("Database not available for protected areas query")
            return None
        except Exception as e:
            logger.error(f"Error querying protected areas: {e}")
            return None

    def _eval_zoning(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate zoning compatibility.

        Uses PostGIS query against 'zoning_areas' table (MapServer/58 — Zoning).
        Checks if current zoning is compatible with requested development type.
        """
        try:
            result = self._run_async_query(self._query_zoning(lat, lng, dev_type))
            
            if result is None:
                logger.debug(f"zoning: no PostGIS data for ({lat}, {lng})")
                return self._zoning_placeholder(dev_type)
            
            current_zoning = result.get("zone_type", "Unknown")
            zone_code = result.get("zone_code", "")
            is_compatible = result.get("is_compatible", False)
            
            # Score based on zoning compatibility
            if is_compatible:
                score = 95
                constraints = []
            elif "residential" in current_zoning.lower() and dev_type == "commercial":
                score = 40
                constraints = ["Rezoning from residential to commercial required"]
            elif "industrial" in current_zoning.lower():
                score = 30 if dev_type == "residential" else 60
                constraints = ["Rezoning or special consent may be required"]
            else:
                score = 55
                constraints = []
            
            return CriterionResult(
                criterion="zoning_compatible",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "current_zoning": current_zoning,
                    "zone_code": zone_code,
                    "compatible_with": dev_type,
                    "rezoning_required": not is_compatible,
                    "data_source": "PostGIS - City of Cape Town Zoning"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Zoning evaluation failed: {e}")
            return self._zoning_placeholder(dev_type)
    
    def _zoning_placeholder(self, dev_type: str) -> CriterionResult:
        """Fallback placeholder for zoning."""
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
    
    async def _query_zoning(self, lat: float, lng: float, dev_type: str) -> Optional[Dict[str, Any]]:
        """Query PostGIS for zoning information."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                query = text("""
                    SELECT 
                        zone_code,
                        zone_type,
                        zone_name,
                        permitted_uses
                    FROM zoning_areas
                    WHERE ST_Intersects(
                        geom,
                        ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    )
                    LIMIT 1
                """)
                
                result = await conn.execute(query, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    zone_code = row[0] or ""
                    zone_type = row[1] or "Unknown"
                    zone_name = row[2] or ""
                    permitted_uses = row[3] or []
                    
                    # Simple compatibility check
                    is_compatible = self._check_zoning_compatibility(
                        zone_type, zone_name, permitted_uses, dev_type
                    )
                    
                    return {
                        "zone_code": zone_code,
                        "zone_type": zone_type,
                        "zone_name": zone_name,
                        "permitted_uses": permitted_uses,
                        "is_compatible": is_compatible
                    }
                else:
                    return {
                        "zone_type": "Unzoned",
                        "zone_code": "",
                        "is_compatible": False
                    }
        except DatabaseConnectionError:
            logger.debug("Database not available for zoning query")
            return None
        except Exception as e:
            logger.error(f"Error querying zoning: {e}")
            return None
    
    def _check_zoning_compatibility(
        self,
        zone_type: str,
        zone_name: str,
        permitted_uses: Any,
        dev_type: str
    ) -> bool:
        """Check if development type is compatible with zoning."""
        zone_lower = f"{zone_type} {zone_name}".lower()
        dev_lower = dev_type.lower()
        
        # Simple keyword matching
        if dev_lower == "residential":
            return any(kw in zone_lower for kw in ["residential", "mixed", "dwelling"])
        elif dev_lower == "commercial":
            return any(kw in zone_lower for kw in ["commercial", "business", "mixed", "retail"])
        elif dev_lower == "industrial":
            return any(kw in zone_lower for kw in ["industrial", "manufacturing", "warehouse"])
        
        return False

    def _eval_road_access(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate road access.

        Uses PostGIS ST_Distance query against road network layer.
        Calculates distance to nearest classified road in meters (EPSG:32734).
        """
        try:
            result = self._run_async_query(self._query_road_access(lat, lng))
            
            if result is None:
                logger.debug(f"road_access: no PostGIS data for ({lat}, {lng})")
                return self._road_access_placeholder()
            
            distance_m = result.get("distance_m")
            road_class = result.get("road_class", "Unknown")
            road_name = result.get("road_name", "Unknown")
            
            # Score based on distance to road (closer is generally better)
            if distance_m is None:
                score = 50
            elif distance_m < 50:
                score = 95
            elif distance_m < 100:
                score = 90
            elif distance_m < 250:
                score = 80
            elif distance_m < 500:
                score = 65
            elif distance_m < 1000:
                score = 45
            else:
                score = 25
            
            # Adjust score based on road class
            if "highway" in road_class.lower() or "primary" in road_class.lower():
                score = min(100, score + 5)
            
            constraints = []
            if distance_m and distance_m > 500:
                constraints.append("Site access may require new road construction")
            
            return CriterionResult(
                criterion="road_access",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "distance_to_road_m": distance_m,
                    "nearest_road_name": road_name,
                    "nearest_road_class": road_class,
                    "access_quality": "Good" if distance_m and distance_m < 100 else "Moderate",
                    "data_source": "PostGIS - City of Cape Town Road Network"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Road access evaluation failed: {e}")
            return self._road_access_placeholder()
    
    def _road_access_placeholder(self) -> CriterionResult:
        """Fallback placeholder for road access."""
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
    
    async def _query_road_access(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Query PostGIS for road network proximity."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                query = text("""
                    SELECT 
                        name,
                        road_type,
                        road_class,
                        ST_Distance(
                            ST_Transform(geom, 32734),
                            ST_Transform(ST_SetSRID(ST_Point(:lng, :lat), 4326), 32734)
                        ) as distance_m
                    FROM roads
                    ORDER BY geom <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    LIMIT 1
                """)
                
                result = await conn.execute(query, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "road_name": row[0] or "Unnamed Road",
                        "road_type": row[1] or "Unknown",
                        "road_class": row[2] or "Unknown",
                        "distance_m": round(row[3], 1)
                    }
                else:
                    return {"distance_m": None}
        except DatabaseConnectionError:
            logger.debug("Database not available for road access query")
            return None
        except Exception as e:
            logger.error(f"Error querying road network: {e}")
            return None

    def _eval_transport_access(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate public transport access.

        Uses PostGIS ST_Distance query against 'transport_stops' table
        (MyCiTi stops from MapServer/96 and rail stations from MapServer/235).
        """
        try:
            result = self._run_async_query(self._query_transport_access(lat, lng))
            
            if result is None:
                logger.debug(f"transport_access: no PostGIS data for ({lat}, {lng})")
                return self._transport_access_placeholder()
            
            distance_m = result.get("distance_m")
            transit_type = result.get("transit_type", "Unknown")
            stop_name = result.get("stop_name", "Unknown")
            
            # Score based on distance to public transport
            # Walkable distance: 500m (5-7 min walk) is ideal
            if distance_m is None:
                score = 50
            elif distance_m < 250:
                score = 95  # Excellent access
            elif distance_m < 500:
                score = 85  # Good access
            elif distance_m < 800:
                score = 70  # Acceptable
            elif distance_m < 1200:
                score = 50  # Marginal
            else:
                score = 25  # Poor access
            
            # Bonus for rail station (higher capacity)
            if "rail" in transit_type.lower() or "train" in transit_type.lower():
                score = min(100, score + 5)
            
            # Calculate walking time (assuming 80m/min)
            walking_time_min = round(distance_m / 80, 1) if distance_m else None
            
            constraints = []
            if distance_m and distance_m > 1000:
                constraints.append("Poor public transport access - car dependency likely")
            
            return CriterionResult(
                criterion="transport_access",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "distance_to_transit_m": distance_m,
                    "nearest_stop_name": stop_name,
                    "nearest_transit_type": transit_type,
                    "walking_time_min": walking_time_min,
                    "data_source": "PostGIS - City of Cape Town Transport Network"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Transport access evaluation failed: {e}")
            return self._transport_access_placeholder()
    
    def _transport_access_placeholder(self) -> CriterionResult:
        """Fallback placeholder for transport access."""
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
    
    async def _query_transport_access(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Query PostGIS for public transport proximity."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                query = text("""
                    SELECT 
                        name,
                        stop_type,
                        ST_Distance(
                            ST_Transform(geom, 32734),
                            ST_Transform(ST_SetSRID(ST_Point(:lng, :lat), 4326), 32734)
                        ) as distance_m
                    FROM transport_stops
                    ORDER BY geom <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    LIMIT 1
                """)
                
                result = await conn.execute(query, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "stop_name": row[0] or "Unknown Stop",
                        "transit_type": row[1] or "Unknown",
                        "distance_m": round(row[2], 1)
                    }
                else:
                    return {"distance_m": None}
        except DatabaseConnectionError:
            logger.debug("Database not available for transport access query")
            return None
        except Exception as e:
            logger.error(f"Error querying transport stops: {e}")
            return None

    def _eval_utilities(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate utilities access.

        Uses PostGIS proximity queries against service_facilities table
        for water and electricity infrastructure.
        """
        try:
            result = self._run_async_query(self._query_utilities(lat, lng))
            
            if result is None:
                logger.debug(f"utilities: no PostGIS data for ({lat}, {lng})")
                return self._utilities_placeholder()
            
            water_distance = result.get("water_distance_m")
            electricity_distance = result.get("electricity_distance_m")
            
            # Score based on proximity to utilities infrastructure
            # Closer to existing infrastructure = easier/cheaper connection
            water_score = self._score_utility_distance(water_distance)
            electricity_score = self._score_utility_distance(electricity_distance)
            
            # Average the scores
            score = (water_score + electricity_score) / 2
            
            constraints = []
            if water_distance and water_distance > 2000:
                constraints.append("Water infrastructure extension may be costly")
            if electricity_distance and electricity_distance > 2000:
                constraints.append("Electricity infrastructure extension may be costly")
            
            return CriterionResult(
                criterion="utilities_access",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "water_distance_m": water_distance,
                    "electricity_distance_m": electricity_distance,
                    "water_available": water_distance is not None and water_distance < 1000,
                    "electricity_available": electricity_distance is not None and electricity_distance < 1000,
                    "sewer_available": None,  # Would need separate sewer layer
                    "data_source": "PostGIS - City of Cape Town Utilities"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Utilities evaluation failed: {e}")
            return self._utilities_placeholder()
    
    def _utilities_placeholder(self) -> CriterionResult:
        """Fallback placeholder for utilities."""
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
    
    def _score_utility_distance(self, distance_m: Optional[float]) -> float:
        """Score utility access based on distance."""
        if distance_m is None:
            return 50
        elif distance_m < 200:
            return 95
        elif distance_m < 500:
            return 85
        elif distance_m < 1000:
            return 75
        elif distance_m < 2000:
            return 60
        elif distance_m < 5000:
            return 40
        else:
            return 20
    
    async def _query_utilities(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Query PostGIS for utilities proximity."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                # Query water facilities
                query_water = text("""
                    SELECT 
                        ST_Distance(
                            ST_Transform(geom, 32734),
                            ST_Transform(ST_SetSRID(ST_Point(:lng, :lat), 4326), 32734)
                        ) as distance_m
                    FROM service_facilities
                    WHERE facility_type = 'water_facility'
                    ORDER BY geom <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    LIMIT 1
                """)
                
                result = await conn.execute(query_water, {"lng": lng, "lat": lat})
                water_row = result.fetchone()
                water_distance = round(water_row[0], 1) if water_row else None
                
                # Query electricity facilities
                query_electricity = text("""
                    SELECT 
                        ST_Distance(
                            ST_Transform(geom, 32734),
                            ST_Transform(ST_SetSRID(ST_Point(:lng, :lat), 4326), 32734)
                        ) as distance_m
                    FROM service_facilities
                    WHERE facility_type = 'electricity_facility'
                    ORDER BY geom <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    LIMIT 1
                """)
                
                result = await conn.execute(query_electricity, {"lng": lng, "lat": lat})
                electricity_row = result.fetchone()
                electricity_distance = round(electricity_row[0], 1) if electricity_row else None
                
                return {
                    "water_distance_m": water_distance,
                    "electricity_distance_m": electricity_distance
                }
        except DatabaseConnectionError:
            logger.debug("Database not available for utilities query")
            return None
        except Exception as e:
            logger.error(f"Error querying utilities: {e}")
            return None

    def _eval_urban_edge(self, lat: float, lng: float, dev_type: str) -> CriterionResult:
        """Evaluate urban edge compliance.

        Uses PostGIS ST_Intersects and ST_Distance queries to check if site
        is within the urban development boundary (urban edge).
        
        Note: If no dedicated urban_edge table exists, we use suburbs table
        as a proxy for urban areas.
        """
        try:
            result = self._run_async_query(self._query_urban_edge(lat, lng))
            
            if result is None:
                logger.debug(f"urban_edge: no PostGIS data for ({lat}, {lng})")
                return self._urban_edge_placeholder()
            
            within_urban_edge = result.get("within_urban_edge", False)
            distance_m = result.get("distance_m")
            
            # Score based on urban edge compliance
            if within_urban_edge:
                score = 95  # Inside urban edge - good for development
                constraints = []
            elif distance_m and distance_m < 500:
                score = 70  # Close to urban edge
                constraints = []
            elif distance_m and distance_m < 2000:
                score = 45  # Outside but close
                constraints = ["Site outside urban edge - development may face restrictions"]
            else:
                score = 20  # Far from urban edge
                constraints = ["Site significantly outside urban edge - development likely prohibited"]
            
            return CriterionResult(
                criterion="urban_edge",
                score=score,
                weight=0,
                weighted_score=0,
                details={
                    "within_urban_edge": within_urban_edge,
                    "distance_to_edge_m": distance_m,
                    "data_source": "PostGIS - City of Cape Town Urban Areas"
                },
                constraints=constraints,
                data_source="postgis",
            )
        except Exception as e:
            logger.warning(f"Urban edge evaluation failed: {e}")
            return self._urban_edge_placeholder()
    
    def _urban_edge_placeholder(self) -> CriterionResult:
        """Fallback placeholder for urban edge."""
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
    
    async def _query_urban_edge(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """Query PostGIS for urban edge / urban area containment."""
        try:
            engine = await get_engine()
            async with engine.connect() as conn:
                # Check if point is within any suburb (proxy for urban area)
                query_intersect = text("""
                    SELECT 
                        name,
                        city
                    FROM suburbs
                    WHERE ST_Intersects(
                        geom,
                        ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    )
                    LIMIT 1
                """)
                
                result = await conn.execute(query_intersect, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "within_urban_edge": True,
                        "suburb_name": row[0],
                        "city": row[1],
                        "distance_m": 0
                    }
                
                # If not inside, calculate distance to nearest suburb
                query_distance = text("""
                    SELECT 
                        name,
                        ST_Distance(
                            ST_Transform(geom, 32734),
                            ST_Transform(ST_SetSRID(ST_Point(:lng, :lat), 4326), 32734)
                        ) as distance_m
                    FROM suburbs
                    ORDER BY geom <-> ST_SetSRID(ST_Point(:lng, :lat), 4326)
                    LIMIT 1
                """)
                
                result = await conn.execute(query_distance, {"lng": lng, "lat": lat})
                row = result.fetchone()
                
                if row:
                    return {
                        "within_urban_edge": False,
                        "nearest_suburb": row[0],
                        "distance_m": round(row[1], 1)
                    }
                else:
                    return {
                        "within_urban_edge": False,
                        "distance_m": None
                    }
        except DatabaseConnectionError:
            logger.debug("Database not available for urban edge query")
            return None
        except Exception as e:
            logger.error(f"Error querying urban edge: {e}")
            return None

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
