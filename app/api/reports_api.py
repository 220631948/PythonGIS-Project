"""
Reports API - Generate downloadable reports in various formats

Provides REST API for:
- PDF report generation with charts and maps
- CSV/Excel data exports
- Summary statistics reports
- Custom analysis reports
"""

import logging
import io
import csv
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pandas as pd
import geopandas as gpd

from app.config import settings
from app.core.data_loader import data_loader
from app.core.cache_manager import cache_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports & Export"])


class ReportRequest(BaseModel):
    """Report generation request"""
    title: str = "Cape Town GeoHub Report"
    datasets: List[str] = []
    include_summary: bool = True
    include_metadata: bool = True
    filters: Optional[Dict[str, Any]] = None


class ExportRequest(BaseModel):
    """Data export request"""
    dataset: str
    format: str = "csv"  # csv, geojson, excel
    columns: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None


@router.get("/summary")
async def get_summary_report(
    datasets: Optional[str] = Query(None, description="Comma-separated dataset names"),
    include_metadata: bool = Query(True)
):
    """
    Generate a summary report of datasets and their statistics.
    """
    try:
        dataset_list = datasets.split(",") if datasets else list(settings.DATA_URLS.keys())

        report = {
            "title": "Cape Town GeoHub Data Summary",
            "generated_at": datetime.now().isoformat(),
            "datasets": [],
            "total_features": 0,
            "data_categories": {}
        }

        for ds_name in dataset_list:
            try:
                gdf = data_loader.get_gdf(ds_name)
                if gdf.empty:
                    continue

                ds_info = {
                    "name": ds_name,
                    "display_name": ds_name.replace("_", " ").title(),
                    "feature_count": len(gdf),
                    "geometry_type": gdf.geometry.geom_type.iloc[0] if len(gdf) > 0 else None,
                    "columns": list(gdf.columns),
                    "bounds": list(gdf.total_bounds)
                }

                # Add metadata if available
                if include_metadata:
                    ds_info["metadata"] = cache_manager.get_metadata(ds_name)

                # Add basic statistics for numeric columns
                numeric_cols = gdf.select_dtypes(include=['number']).columns.tolist()
                if numeric_cols:
                    ds_info["statistics"] = {}
                    for col in numeric_cols[:5]:  # Limit to first 5 numeric columns
                        ds_info["statistics"][col] = {
                            "min": float(gdf[col].min()) if pd.notna(gdf[col].min()) else None,
                            "max": float(gdf[col].max()) if pd.notna(gdf[col].max()) else None,
                            "mean": float(gdf[col].mean()) if pd.notna(gdf[col].mean()) else None
                        }

                report["datasets"].append(ds_info)
                report["total_features"] += len(gdf)

                # Categorize by geometry type
                geom_type = ds_info["geometry_type"]
                if geom_type:
                    if geom_type not in report["data_categories"]:
                        report["data_categories"][geom_type] = 0
                    report["data_categories"][geom_type] += 1

            except Exception as e:
                logger.warning(f"Could not process dataset {ds_name}: {e}")

        return report

    except Exception as e:
        logger.error(f"Summary report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/{dataset_name}")
async def export_dataset(
    dataset_name: str,
    format: str = Query("csv", description="Export format: csv, geojson"),
    columns: Optional[str] = Query(None, description="Comma-separated columns to include"),
    simplify: Optional[float] = Query(None, description="Simplify geometries"),
    limit: Optional[int] = Query(None, description="Limit number of features")
):
    """
    Export a dataset to CSV or GeoJSON format.
    """
    try:
        gdf = data_loader.get_gdf(dataset_name)
        if gdf.empty:
            raise HTTPException(status_code=404, detail=f"Dataset {dataset_name} not found")

        # Apply limit
        if limit and limit > 0:
            gdf = gdf.head(limit)

        # Apply column filter
        if columns:
            col_list = columns.split(",")
            col_list = [c.strip() for c in col_list if c.strip() in gdf.columns]
            if col_list:
                col_list.append('geometry')  # Always include geometry
                gdf = gdf[col_list]

        # Simplify if requested
        if simplify and simplify > 0:
            gdf = gdf.copy()
            gdf['geometry'] = gdf['geometry'].simplify(simplify)

        if format.lower() == "csv":
            # Convert to CSV (without geometry for CSV)
            df = pd.DataFrame(gdf.drop(columns='geometry'))

            output = io.StringIO()
            df.to_csv(output, index=False)
            output.seek(0)

            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename={dataset_name}.csv"
                }
            )

        elif format.lower() == "geojson":
            geojson_str = gdf.to_json()

            return StreamingResponse(
                iter([geojson_str]),
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename={dataset_name}.geojson"
                }
            )

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis-report")
async def generate_analysis_report(
    lat: float = Query(..., description="Analysis center latitude"),
    lon: float = Query(..., description="Analysis center longitude"),
    radius_meters: int = Query(1000, description="Analysis radius")
):
    """
    Generate a comprehensive analysis report for a location.

    Includes nearby facilities, accessibility scores, and recommendations.
    """
    try:
        from shapely.geometry import Point
        from app.spatial_analysis.spatial_utils import create_buffer

        point = Point(lon, lat)
        buffer = create_buffer(point, radius_meters)

        report = {
            "title": "Location Analysis Report",
            "generated_at": datetime.now().isoformat(),
            "location": {"lat": lat, "lon": lon},
            "radius_meters": radius_meters,
            "analyses": []
        }

        # Analyze each relevant dataset
        datasets_to_analyze = [
            ("myciti_stops", "Public Transport - MyCiti"),
            ("rail_stations", "Rail Stations"),
            ("clinics", "Healthcare Facilities"),
            ("schools", "Educational Facilities"),
            ("parks", "Parks & Recreation"),
        ]

        for ds_name, ds_label in datasets_to_analyze:
            try:
                gdf = data_loader.get_gdf(ds_name)
                if gdf.empty:
                    continue

                # Find features within buffer
                nearby = gdf[gdf.geometry.within(buffer)]

                analysis = {
                    "category": ds_label,
                    "dataset": ds_name,
                    "count_within_radius": len(nearby),
                    "nearest_distance_meters": None,
                    "features": []
                }

                if not nearby.empty:
                    # Calculate distances
                    point_gdf = gpd.GeoDataFrame(geometry=[point], crs=settings.TARGET_CRS)
                    point_proj = point_gdf.to_crs(settings.PROJECTED_CRS).geometry.iloc[0]
                    nearby_proj = nearby.to_crs(settings.PROJECTED_CRS)
                    nearby_proj['distance'] = nearby_proj.geometry.distance(point_proj)

                    analysis["nearest_distance_meters"] = round(nearby_proj['distance'].min(), 0)

                    # Get feature names
                    for _, row in nearby_proj.nsmallest(5, 'distance').iterrows():
                        name = "Unknown"
                        for col in ['name', 'NAME', 'facility_name', 'stop_name']:
                            if col in row.index and pd.notna(row[col]):
                                name = row[col]
                                break
                        analysis["features"].append({
                            "name": name,
                            "distance_meters": round(row['distance'], 0)
                        })

                report["analyses"].append(analysis)

            except Exception as e:
                logger.warning(f"Could not analyze {ds_name}: {e}")

        # Calculate overall scores
        report["scores"] = _calculate_location_scores(report["analyses"])
        report["recommendations"] = _generate_recommendations(report["scores"])

        return report

    except Exception as e:
        logger.error(f"Analysis report generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard-data")
async def get_dashboard_data():
    """
    Get aggregated data for the analytics dashboard.
    """
    try:
        dashboard = {
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_datasets": 0,
                "total_features": 0,
                "categories": {}
            },
            "charts": {
                "features_by_dataset": [],
                "geometry_distribution": [],
                "coverage_by_suburb": []
            },
            "key_metrics": []
        }

        # Aggregate dataset statistics
        for ds_name in settings.DATA_URLS.keys():
            try:
                gdf = data_loader.get_gdf(ds_name)
                if gdf.empty:
                    continue

                dashboard["summary"]["total_datasets"] += 1
                dashboard["summary"]["total_features"] += len(gdf)

                # Categorize
                geom_type = gdf.geometry.geom_type.iloc[0] if len(gdf) > 0 else "Unknown"
                if geom_type not in dashboard["summary"]["categories"]:
                    dashboard["summary"]["categories"][geom_type] = 0
                dashboard["summary"]["categories"][geom_type] += 1

                # Add to chart data
                dashboard["charts"]["features_by_dataset"].append({
                    "name": ds_name.replace("_", " ").title(),
                    "value": len(gdf)
                })

            except Exception:
                pass

        # Geometry distribution for pie chart
        for geom_type, count in dashboard["summary"]["categories"].items():
            dashboard["charts"]["geometry_distribution"].append({
                "name": geom_type,
                "value": count
            })

        # Calculate key metrics
        dashboard["key_metrics"] = [
            {
                "label": "Total Datasets",
                "value": dashboard["summary"]["total_datasets"],
                "icon": "database"
            },
            {
                "label": "Total Features",
                "value": dashboard["summary"]["total_features"],
                "icon": "map-pin"
            },
            {
                "label": "Point Layers",
                "value": dashboard["summary"]["categories"].get("Point", 0),
                "icon": "circle"
            },
            {
                "label": "Polygon Layers",
                "value": dashboard["summary"]["categories"].get("Polygon", 0) +
                        dashboard["summary"]["categories"].get("MultiPolygon", 0),
                "icon": "square"
            }
        ]

        return dashboard

    except Exception as e:
        logger.error(f"Dashboard data generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _calculate_location_scores(analyses: List[Dict]) -> Dict[str, int]:
    """Calculate accessibility scores based on nearby facilities."""
    scores = {
        "transport": 0,
        "healthcare": 0,
        "education": 0,
        "recreation": 0,
        "overall": 0
    }

    for analysis in analyses:
        count = analysis.get("count_within_radius", 0)
        nearest = analysis.get("nearest_distance_meters")
        dataset = analysis.get("dataset", "")

        # Calculate score based on proximity and count
        if nearest is not None:
            proximity_score = max(0, 100 - (nearest / 10))  # 0m = 100, 1000m = 0
        else:
            proximity_score = 0

        count_bonus = min(count * 10, 50)  # Up to 50 bonus for multiple facilities
        category_score = min(proximity_score + count_bonus, 100)

        if dataset in ["myciti_stops", "rail_stations"]:
            scores["transport"] = max(scores["transport"], int(category_score))
        elif dataset == "clinics":
            scores["healthcare"] = int(category_score)
        elif dataset == "schools":
            scores["education"] = int(category_score)
        elif dataset == "parks":
            scores["recreation"] = int(category_score)

    # Calculate overall
    scores["overall"] = int(sum([
        scores["transport"] * 0.35,
        scores["healthcare"] * 0.25,
        scores["education"] * 0.2,
        scores["recreation"] * 0.2
    ]))

    return scores


def _generate_recommendations(scores: Dict[str, int]) -> List[str]:
    """Generate recommendations based on location scores."""
    recommendations = []

    if scores["transport"] < 50:
        recommendations.append("Limited public transport access. Consider car-dependent lifestyle.")
    elif scores["transport"] >= 80:
        recommendations.append("Excellent public transport connectivity.")

    if scores["healthcare"] < 50:
        recommendations.append("Healthcare facilities are not within easy walking distance.")

    if scores["education"] < 50:
        recommendations.append("Schools may require transport access.")

    if scores["recreation"] >= 70:
        recommendations.append("Good access to parks and recreational facilities.")

    if scores["overall"] >= 80:
        recommendations.append("Overall excellent location for urban living.")
    elif scores["overall"] >= 60:
        recommendations.append("Good location with adequate access to services.")
    elif scores["overall"] < 40:
        recommendations.append("Limited access to urban services. Better suited for car-dependent residents.")

    return recommendations
