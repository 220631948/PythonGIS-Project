import json
import logging
from typing import Dict, Any, Optional, Union
from sqlalchemy import text

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.spatial_analysis.base import BaseAnalyzer
from app.config import settings
from app.core.database import require_engine

logger = logging.getLogger(__name__)

class ServicesAnalyzer(BaseAnalyzer):
    def __init__(self):
        super().__init__("services")

    def run_analysis(self, simplify: Optional[float] = None) -> Union[Dict[str, Any], str]:
        """
        Analyzes access to water and electricity for informal settlements using PostGIS.
        Returns a JSON string (for optimized response) or a Dict (for error).
        """
        try:
            # We will use a powerful SQL query to do the heavy lifting

            # Use ST_Simplify if requested
            geom_expr = "s.geom"
            if simplify:
                # ST_Simplify works on geometry. If s.geom is 4326, tolerance is degrees.
                # Assuming s.geom is appropriate for the simplify parameter provided.
                geom_expr = f"ST_Simplify(s.geom, {simplify})"

            query = f"""
            WITH water_dist AS (
                SELECT 
                    s.id,
                    MIN(ST_Distance(s.geom::geography, f.geom::geography)) as dist_water
                FROM informal_settlements s
                CROSS JOIN service_facilities f
                WHERE f.facility_type = 'water_facility'
                GROUP BY s.id
            ),
            elec_dist AS (
                SELECT 
                    s.id,
                    MIN(ST_Distance(s.geom::geography, f.geom::geography)) as dist_elec
                FROM informal_settlements s
                CROSS JOIN service_facilities f
                WHERE f.facility_type = 'electricity_facility'
                GROUP BY s.id
            ),
            data AS (
                SELECT
                    s.id, s.name, s.estimated_households,
                    COALESCE(w.dist_water, 5000) as dist_water,
                    COALESCE(e.dist_elec, 5000) as dist_elec,
                    {geom_expr} as geom
                FROM informal_settlements s
                LEFT JOIN water_dist w ON s.id = w.id
                LEFT JOIN elec_dist e ON s.id = e.id
            ),
            scored AS (
                SELECT
                    id, name, estimated_households,
                    dist_water, dist_elec,
                    geom,
                    (CASE WHEN dist_water < 500 THEN 100 WHEN dist_water > 2000 THEN 0 ELSE 100 - ((dist_water - 500) / 15.0) END) as w_score,
                    (CASE WHEN dist_elec < 500 THEN 100 WHEN dist_elec > 2000 THEN 0 ELSE 100 - ((dist_elec - 500) / 15.0) END) as e_score
                FROM data
            ),
            final AS (
                SELECT
                    *,
                    (w_score + e_score) / 2.0 as access_score,
                    (CASE WHEN (w_score + e_score) / 2.0 > 80 THEN 'High' WHEN (w_score + e_score) / 2.0 > 40 THEN 'Medium' ELSE 'Low' END) as access_level
                FROM scored
            ),
            summary AS (
                SELECT count(*) as total, avg(access_score) as avg_score FROM final
            ),
            levels AS (
                SELECT access_level, count(*) as count FROM final GROUP BY access_level
            ),
            features AS (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'properties', json_build_object(
                            'id', id,
                            'name', name,
                            'water_s', round(dist_water::numeric, 0),
                            'elec_dist', round(dist_elec::numeric, 0),
                            'access_score', round(access_score::numeric, 1),
                            'access_level', access_level,
                            'water_access', round(dist_water::numeric, 0) || 'm',
                            'electricity_access', round(dist_elec::numeric, 0) || 'm'
                        ),
                        'geometry', ST_AsGeoJSON(geom)::json
                    )
                ), '[]'::json) as feats FROM final
            )
            SELECT json_build_object(
                'geojson', json_build_object(
                    'type', 'FeatureCollection',
                    'features', (SELECT feats FROM features)
                ),
                'summary', json_build_object(
                    'total_settlements', (SELECT total FROM summary),
                    'avg_score', (SELECT round(avg_score::numeric, 1) FROM summary),
                    'levels', (SELECT COALESCE(json_object_agg(access_level, count), '{{}}'::json) FROM levels)
                ),
                'metadata', json_build_object('note', 'Analyzed via PostGIS')
            )::text as result
            """

            try:
                # Wrap connection in try-block to ensure fallback on connection failure
                with require_engine().connect() as conn:
                    # Execute optimized query
                    result = conn.execute(text(query)).scalar()
                    if result:
                        return result
                    else:
                        # Should unlikely happen given the query structure, but safe fallback
                        return self._fallback_analysis(simplify)

            except Exception as db_err:
                logger.warning(f"PostGIS analysis failed ({db_err}), falling back to partial GeoPandas...")
                # Fallback to original implementation if DB tables missing
                return self._fallback_analysis(simplify)

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return {"error": str(e)}

    def _fallback_analysis(self, simplify) -> Union[str, Dict[str, Any]]:
        """
        Fallback analysis method using GeoPandas if PostGIS analysis fails.
        Returns JSON string for consistency and performance.
        """
        settlements = self.load_dataset("informal_settlements")
        water = self.load_dataset("water_facilities")
        electricity = self.load_dataset("electricity_facilities")

        if settlements.empty:
            return {"error": "No informal settlements data found"}

        # Project for distance calculation
        settlements_proj = settlements.to_crs(settings.PROJECTED_CRS)
        settlements_proj['centroid'] = settlements_proj.geometry.centroid

        water_proj = water.to_crs(settings.PROJECTED_CRS) if not water.empty else None
        elec_proj = electricity.to_crs(settings.PROJECTED_CRS) if not electricity.empty else None

        def get_min_dist(point, facilities_gdf):
            if facilities_gdf is None or facilities_gdf.empty:
                return 5000  # Default large distance if no facilities
            return facilities_gdf.distance(point).min()

        logger.info("Calculating distances to facilities...")
        settlements_proj['dist_water'] = settlements_proj['centroid'].apply(lambda x: get_min_dist(x, water_proj))
        settlements_proj['dist_elec'] = settlements_proj['centroid'].apply(lambda x: get_min_dist(x, elec_proj))

        # Score: 100 is best. Penalty for distance.
        # 0-500m: 100 score, 500m-2000m: linear drop, >2000m: 0 score.
        def calculate_score(dist):
            if dist < 500: return 100
            if dist > 2000: return 0
            return 100 - ((dist - 500) / 15)

        settlements_proj['water_score'] = settlements_proj['dist_water'].apply(calculate_score)
        settlements_proj['elec_score'] = settlements_proj['dist_elec'].apply(calculate_score)
        settlements_proj['access_score'] = (settlements_proj['water_score'] + settlements_proj['elec_score']) / 2

        # Classify
        settlements_proj['access_level'] = settlements_proj['access_score'].apply(
            lambda x: "High" if x > 80 else ("Medium" if x > 40 else "Low")
        )

        # Cleanup and simplify for output
        results = settlements_proj.drop(columns=['centroid']).to_crs(settings.TARGET_CRS)
        if simplify:
            results.geometry = results.geometry.simplify(simplify)
        elif settings.SIMPLIFICATION_TOLERANCE:
            results.geometry = results.geometry.simplify(settings.SIMPLIFICATION_TOLERANCE)

        # Optimize: Return constructed JSON string directly to avoid double serialization

        # 1. GeoJSON string
        # Use na="null" to handle NaNs correctly in JSON
        geojson_str = results.to_json(na="null")

        # 2. Metadata/Summary strings
        summary = {
            "total_settlements": len(results),
            "avg_score": float(results['access_score'].mean()) if not results.empty else 0,
            "levels": results['access_level'].value_counts().to_dict() if 'access_level' in results else {}
        }

        metadata = {
            "informal_settlements": self.get_metadata("informal_settlements"),
            "water": self.get_metadata("water_facilities"),
            "electricity": self.get_metadata("electricity_facilities")
        }

        # 3. Construct final JSON string manually
        # Structure: {"geojson": <geojson_str>, "summary": <summary_json>, "metadata": <metadata_json>}

        return (
            '{"geojson": ' + geojson_str +
            ', "summary": ' + json.dumps(summary) +
            ', "metadata": ' + json.dumps(metadata) +
            '}'
        )

services_analyzer = ServicesAnalyzer()
