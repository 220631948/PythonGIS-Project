"""
Export API - Endpoints for data export and printable reports

Provides:
- Export spatial data in CSV, XLSX, GeoJSON, PDF formats
- Printable maps with legends, titles, scale bars
- Analysis result exports
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Dict
from datetime import datetime, timedelta
import json
import csv
import uuid
import logging

from app.models.export_models import (
    ExportFormat, DataExportRequest, AnalysisExportRequest,
    ExportResponse, MapPrintConfig
)
from app.core.data_loader import data_loader
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/export", tags=["Export & Reports"])

# Export storage directory
EXPORT_DIR = settings.CACHE_DIR / "exports"
EXPORT_DIR.mkdir(exist_ok=True)

# Track exports for cleanup
_exports: Dict[str, ExportResponse] = {}


def _generate_simple_kml(gdf, name: str) -> str:
    """Generate a simple KML string from a GeoDataFrame"""
    import pandas as pd
    kml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<kml xmlns="http://www.opengis.net/kml/2.2">',
        f'<Document><name>{name}</name>'
    ]

    indices = gdf.index.tolist()
    geometries = gdf.geometry.tolist()
    df_no_geom = pd.DataFrame(gdf.drop(columns=['geometry']))
    attributes_list = df_no_geom.to_dict('records')

    for idx, geom, attributes in zip(indices, geometries, attributes_list):
        if geom is None:
            continue

        # Get placemark name
        placemark_name = str(attributes.get('name', attributes.get('Name', f'Feature {idx}')))

        kml_parts.append(f'<Placemark><name>{placemark_name}</name>')

        if geom.geom_type == 'Point':
            kml_parts.append(f'<Point><coordinates>{geom.x},{geom.y},0</coordinates></Point>')
        elif geom.geom_type in ('Polygon', 'MultiPolygon'):
            if geom.geom_type == 'MultiPolygon':
                geom = list(geom.geoms)[0]  # Take first polygon
            coords = ','.join([f'{x},{y},0' for x, y in geom.exterior.coords])
            kml_parts.append(f'<Polygon><outerBoundaryIs><LinearRing><coordinates>{coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>')
        elif geom.geom_type in ('LineString', 'MultiLineString'):
            if geom.geom_type == 'MultiLineString':
                geom = list(geom.geoms)[0]
            coords = ','.join([f'{x},{y},0' for x, y in geom.coords])
            kml_parts.append(f'<LineString><coordinates>{coords}</coordinates></LineString>')

        kml_parts.append('</Placemark>')

    kml_parts.append('</Document></kml>')
    return '\n'.join(kml_parts)


def _gdf_to_geojson(gdf) -> str:
    """
    Convert GeoDataFrame to GeoJSON string manually.
    Works around numpy 2.0 compatibility issues with geopandas.
    """
    from shapely.geometry import mapping
    import pandas as pd

    features = []
    indices = gdf.index.tolist()
    geometries = gdf.geometry.tolist()
    df_no_geom = pd.DataFrame(gdf.drop(columns=['geometry']))
    attributes_list = df_no_geom.to_dict('records')

    for idx, geom, attributes in zip(indices, geometries, attributes_list):
        properties = {}
        for col, val in attributes.items():
            # Handle numpy types
            if hasattr(val, 'item'):
                val = val.item()
            # Handle NaN
            if isinstance(val, float) and (val != val):  # NaN check
                val = None
            properties[col] = val

        feature = {
            "type": "Feature",
            "id": str(idx),
            "properties": properties,
            "geometry": mapping(geom) if geom is not None else None
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    return json.dumps(geojson)


def _cleanup_old_exports():
    """Remove exports older than 1 hour"""
    now = datetime.utcnow()
    to_delete = []

    for file_id, export in _exports.items():
        if export.expires_at < now:
            to_delete.append(file_id)
            filepath = EXPORT_DIR / export.filename
            if filepath.exists():
                filepath.unlink()

    for file_id in to_delete:
        del _exports[file_id]


@router.post("/data", response_model=ExportResponse)
async def export_data(request: DataExportRequest, background_tasks: BackgroundTasks):
    """
    Export spatial dataset in specified format

    Supports: CSV, XLSX, GeoJSON, Shapefile, KML
    """
    background_tasks.add_task(_cleanup_old_exports)

    try:
        gdf = data_loader.get_gdf(request.dataset)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Dataset not found: {request.dataset}")

    if gdf.empty:
        raise HTTPException(status_code=404, detail="Dataset is empty")

    # Apply bbox filter
    if request.filter_bbox:
        min_lng, min_lat, max_lng, max_lat = request.filter_bbox
        gdf = gdf.cx[min_lng:max_lng, min_lat:max_lat]

    # Apply simplification
    if request.simplify:
        gdf = gdf.copy()
        gdf['geometry'] = gdf['geometry'].simplify(request.simplify)

    # Select columns
    if request.columns:
        available_cols = set(gdf.columns) - {'geometry'}
        selected = [c for c in request.columns if c in available_cols]
        if 'geometry' in gdf.columns:
            selected.append('geometry')
        gdf = gdf[selected]

    # Generate export
    file_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    if request.format == ExportFormat.CSV:
        filename = f"{request.dataset}_{timestamp}.csv"
        filepath = EXPORT_DIR / filename
        # Drop geometry for CSV
        df = gdf.drop(columns=['geometry'], errors='ignore')
        df.to_csv(filepath, index=False)

    elif request.format == ExportFormat.GEOJSON:
        filename = f"{request.dataset}_{timestamp}.geojson"
        filepath = EXPORT_DIR / filename
        # Use custom converter to avoid numpy 2.0 compatibility issues
        geojson_str = _gdf_to_geojson(gdf)
        with open(filepath, 'w') as f:
            f.write(geojson_str)

    elif request.format == ExportFormat.XLSX:
        filename = f"{request.dataset}_{timestamp}.xlsx"
        filepath = EXPORT_DIR / filename
        df = gdf.drop(columns=['geometry'], errors='ignore')
        df.to_excel(filepath, index=False, engine='openpyxl')

    elif request.format == ExportFormat.KML:
        filename = f"{request.dataset}_{timestamp}.kml"
        filepath = EXPORT_DIR / filename
        try:
            gdf.to_file(filepath, driver='KML')
        except Exception:
            # Fallback: convert to simple KML format manually
            kml_content = _generate_simple_kml(gdf, request.dataset)
            with open(filepath, 'w') as f:
                f.write(kml_content)

    else:
        raise HTTPException(status_code=400, detail=f"Format {request.format} not yet supported")

    size_bytes = filepath.stat().st_size
    expires_at = datetime.utcnow() + timedelta(hours=1)

    export = ExportResponse(
        file_id=file_id,
        filename=filename,
        format=request.format,
        size_bytes=size_bytes,
        download_url=f"/api/export/download/{file_id}",
        expires_at=expires_at,
        metadata={
            "dataset": request.dataset,
            "feature_count": len(gdf),
            "columns": list(gdf.columns)
        }
    )

    _exports[file_id] = export
    logger.info(f"Created export {file_id}: {filename} ({size_bytes} bytes)")

    return export


@router.get("/download/{file_id}")
async def download_export(file_id: str):
    """Download an exported file"""
    if file_id not in _exports:
        raise HTTPException(status_code=404, detail="Export not found or expired")

    export = _exports[file_id]
    filepath = EXPORT_DIR / export.filename

    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Export file not found")

    # Determine media type
    media_types = {
        ExportFormat.CSV: "text/csv",
        ExportFormat.XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ExportFormat.GEOJSON: "application/geo+json",
        ExportFormat.KML: "application/vnd.google-earth.kml+xml",
        ExportFormat.PDF: "application/pdf"
    }

    return FileResponse(
        path=filepath,
        filename=export.filename,
        media_type=media_types.get(export.format, "application/octet-stream")
    )


@router.post("/analysis", response_model=ExportResponse)
async def export_analysis(request: AnalysisExportRequest, background_tasks: BackgroundTasks):
    """
    Export analysis results

    Includes suitability analysis, flood risk, etc.
    """
    background_tasks.add_task(_cleanup_old_exports)

    # Generate analysis based on type
    from app.spatial_analysis.site_suitability import site_analyzer

    file_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    if request.analysis_type == "suitability":
        lat = request.parameters.get("lat", -33.9249)
        lng = request.parameters.get("lng", 18.4241)
        dev_type = request.parameters.get("development_type", "residential")

        result = site_analyzer.analyze_point(lat, lng, dev_type)

        export_data = {
            "analysis_type": "suitability",
            "location": result.location,
            "overall_score": result.overall_score,
            "suitability_class": result.suitability_class,
            "criteria_results": [
                {
                    "criterion": r.criterion,
                    "score": r.score,
                    "weight": r.weight,
                    "weighted_score": r.weighted_score,
                    "details": r.details
                }
                for r in result.criteria_results
            ],
            "constraints_violated": result.constraints_violated,
            "recommendations": result.recommendations,
            "generated_at": datetime.utcnow().isoformat()
        }
    else:
        export_data = {
            "analysis_type": request.analysis_type,
            "parameters": request.parameters,
            "message": "Analysis type not fully implemented",
            "generated_at": datetime.utcnow().isoformat()
        }

    if request.format == ExportFormat.CSV:
        filename = f"analysis_{request.analysis_type}_{timestamp}.csv"
        filepath = EXPORT_DIR / filename

        # Flatten for CSV
        with open(filepath, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["Field", "Value"])
            for key, value in export_data.items():
                if isinstance(value, (list, dict)):
                    writer.writerow([key, json.dumps(value)])
                else:
                    writer.writerow([key, value])

    elif request.format == ExportFormat.GEOJSON:
        filename = f"analysis_{request.analysis_type}_{timestamp}.json"
        filepath = EXPORT_DIR / filename
        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
    else:
        filename = f"analysis_{request.analysis_type}_{timestamp}.json"
        filepath = EXPORT_DIR / filename
        with open(filepath, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)

    size_bytes = filepath.stat().st_size
    expires_at = datetime.utcnow() + timedelta(hours=1)

    export = ExportResponse(
        file_id=file_id,
        filename=filename,
        format=request.format,
        size_bytes=size_bytes,
        download_url=f"/api/export/download/{file_id}",
        expires_at=expires_at,
        metadata={"analysis_type": request.analysis_type}
    )

    _exports[file_id] = export
    return export


@router.post("/map-print")
async def generate_printable_map(config: MapPrintConfig):
    """
    Generate a printable map image/PDF

    Returns configuration for client-side rendering or server-side generation.
    Note: Full PDF generation requires additional libraries (reportlab, PIL).
    """
    # For now, return configuration that frontend can use
    # Full implementation would use matplotlib/reportlab for server-side PDF

    return {
        "status": "configuration_ready",
        "config": config.model_dump(),
        "instructions": {
            "client_side": "Use Leaflet-image or html2canvas to capture the map",
            "server_side": "Server-side PDF generation available with additional setup"
        },
        "print_url": "/api/export/map-print/render?config_id=pending",
        "supported_formats": ["png", "pdf"]
    }


@router.get("/formats")
async def list_export_formats():
    """List available export formats and their capabilities"""
    return {
        "formats": [
            {
                "id": "csv",
                "name": "CSV",
                "extension": ".csv",
                "mime_type": "text/csv",
                "supports_geometry": False,
                "description": "Comma-separated values, attributes only"
            },
            {
                "id": "xlsx",
                "name": "Excel",
                "extension": ".xlsx",
                "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "supports_geometry": False,
                "description": "Microsoft Excel format, attributes only"
            },
            {
                "id": "geojson",
                "name": "GeoJSON",
                "extension": ".geojson",
                "mime_type": "application/geo+json",
                "supports_geometry": True,
                "description": "GeoJSON format with full geometry"
            },
            {
                "id": "kml",
                "name": "KML",
                "extension": ".kml",
                "mime_type": "application/vnd.google-earth.kml+xml",
                "supports_geometry": True,
                "description": "Keyhole Markup Language for Google Earth"
            },
            {
                "id": "pdf",
                "name": "PDF Report",
                "extension": ".pdf",
                "mime_type": "application/pdf",
                "supports_geometry": True,
                "description": "Printable PDF with maps and analysis"
            }
        ]
    }


@router.get("/pending")
async def list_pending_exports():
    """List all pending/available exports"""
    _cleanup_old_exports()
    return {
        "exports": [
            {
                "file_id": e.file_id,
                "filename": e.filename,
                "format": e.format,
                "size_bytes": e.size_bytes,
                "expires_at": e.expires_at.isoformat(),
                "download_url": e.download_url
            }
            for e in _exports.values()
        ]
    }
