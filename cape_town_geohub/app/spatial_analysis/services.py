import json
import logging
import geopandas as gpd
from typing import Dict, Any, Optional
from sqlalchemy import text

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.spatial_analysis.base import BaseAnalyzer
from app.spatial_analysis.spatial_utils import gdf_to_geojson
from app.config import settings
from app.core.database import engine

logger = logging.getLogger(__name__)

class ServicesAnalyzer(BaseAnalyzer):
    def __init__(self):
        super().__init__("services")

    def run_analysis(self, simplify: Optional[float] = None) -> Dict[str, Any]:
        """
        Analyzes access to water and electricity for informal settlements using PostGIS.
        """
        try:
            # We will use a powerful SQL query to do the heavy lifting
            query = """
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
            )
            SELECT 
                s.id, s.name, s.estimated_households,
                w.dist_water, e.dist_elec,
                ST_AsGeoJSON(s.geom) as geometry_json
            FROM informal_settlements s
            LEFT JOIN water_dist w ON s.id = w.id
            LEFT JOIN elec_dist e ON s.id = e.id
            """

            # Check if tables exist before running optimization
            # If not, fallback to GeoPandas method (old code)
            # For this implementations, assume DB is populated via load_spatial_data.py

            with engine.connect() as conn:
                try:
                    result = conn.execute(text(query))
                    rows = result.fetchall()

                    features = []
                    total_score = 0

                    for row in rows:
                        # Logic for scoring
                        dist_w = row.dist_water or 5000
                        dist_e = row.dist_elec or 5000

                        def score(d):
                            if d < 500: return 100
                            if d > 2000: return 0
                            return 100 - ((d - 500) / 15)

                        w_score = score(dist_w)
                        e_score = score(dist_e)
                        access_score = (w_score + e_score) / 2
                        total_score += access_score

                        access_level = "High" if access_score > 80 else ("Medium" if access_score > 40 else "Low")

                        geom = row.geometry_json # JSON string

                        features.append({
                            "type": "Feature",
                            "properties": {
                                "id": row.id,
                                "name": row.name,
                                "water_s": round(dist_w, 0),
                                "elec_dist": round(dist_e, 0),
                                "access_score": round(access_score, 1),
                                "access_level": access_level,
                                "water_access": f"{int(dist_w)}m",
                                "electricity_access": f"{int(dist_e)}m"
                            },
                            "geometry": json.loads(geom) if geom else None
                        })

                    avg_score = total_score / len(features) if features else 0

                    return {
                        "type": "FeatureCollection",
                        "features": features,
                        "metadata": {
                            "summary": {
                                "total_settlements": len(features),
                                "avg_score": round(avg_score, 1)
                            }
                        }
                    }

                except Exception as db_err:
                    logger.warning(f"PostGIS analysis failed ({db_err}), falling back to partial GeoPandas...")
                    # Fallback to original implementation if DB tables missing
                    return self._fallback_analysis(simplify)

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return {"error": str(e)}

    def _fallback_analysis(self, simplify):
        """
        Fallback analysis method using GeoPandas if PostGIS analysis fails.
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

        return {
            "geojson": gdf_to_geojson(results),
            "summary": {
                "total_settlements": len(results),
                "avg_score": float(results['access_score'].mean()),
                "levels": results['access_level'].value_counts().to_dict() if 'access_level' in results else {}
            },
            "metadata": {
                "informal_settlements": self.get_metadata("informal_settlements"),
                "water": self.get_metadata("water_facilities"),
                "electricity": self.get_metadata("electricity_facilities")
            }
        }

services_analyzer = ServicesAnalyzer()
