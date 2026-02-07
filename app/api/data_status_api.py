"""
Data Status API - Monitor data source health and quality

Provides:
- Data source health checks
- Data quality metrics
- Retrieval logs and error reporting
- Data provenance information
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.config import settings
from app.core.data_loader import data_loader

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/data-status", tags=["Data Status"])


@router.get("/health")
async def check_all_sources_health():
    """
    Check the health/accessibility of all configured open data sources.
    Returns status for each data source endpoint.
    """
    results = await data_loader.check_all_sources_health_async()

    total = len(results)
    accessible = sum(1 for r in results.values() if r.get("accessible", False))

    return {
        "summary": {
            "total_sources": total,
            "accessible": accessible,
            "unavailable": total - accessible,
            "health_percentage": round(accessible / total * 100, 1) if total > 0 else 0
        },
        "sources": results,
        "checked_at": datetime.utcnow().isoformat()
    }


@router.get("/health/{dataset_name}")
async def check_source_health(dataset_name: str):
    """Check health of a specific data source."""
    result = await data_loader.check_data_source_health_async(dataset_name)
    return result


@router.get("/retrieval-log")
async def get_retrieval_log(limit: int = Query(50, ge=1, le=100)):
    """
    Get the data retrieval log showing recent fetch attempts.
    Useful for monitoring and debugging data source issues.
    """
    log = data_loader.get_retrieval_log()

    # Get most recent entries
    recent = log[-limit:] if len(log) > limit else log
    recent.reverse()  # Most recent first

    # Calculate statistics
    successful = sum(1 for entry in log if entry.get("success", False))
    failed = len(log) - successful

    return {
        "entries": recent,
        "statistics": {
            "total_recorded": len(log),
            "successful": successful,
            "failed": failed,
            "success_rate": round(successful / len(log) * 100, 1) if log else 0
        },
        "retrieved_at": datetime.utcnow().isoformat()
    }


@router.get("/sources")
async def list_data_sources():
    """
    List all configured open data sources with metadata.
    Includes source URLs, licensing, and update information.
    """
    sources = []

    for name, url in settings.DATA_URLS.items():
        source_info = {
            "name": name,
            "url": url,
            "category": _categorize_dataset(name),
            "provider": _get_provider(url),
            "license": "City of Cape Town Open Data License",
            "attribution": "City of Cape Town"
        }
        sources.append(source_info)

    return {
        "sources": sources,
        "total": len(sources),
        "policy": {
            "data_origin": "All data sourced from official government open data portals",
            "no_mock_data": True,
            "primary_portal": "https://odp.capetown.gov.za/",
            "egis_portal": "https://egis.capetown.gov.za/"
        }
    }


@router.get("/provenance/{dataset_name}")
async def get_data_provenance(dataset_name: str):
    """
    Get detailed provenance information for a specific dataset.
    Includes source, license, last update, and quality metrics.
    """
    if dataset_name not in settings.DATA_URLS:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_name}' not configured")

    url = settings.DATA_URLS[dataset_name]

    # Check current health
    health = await data_loader.check_data_source_health_async(dataset_name)

    return {
        "dataset": dataset_name,
        "provenance": {
            "source_url": url,
            "provider": _get_provider(url),
            "license": "City of Cape Town Open Data License",
            "license_url": "https://odp.capetown.gov.za/pages/terms-of-use",
            "attribution_required": True,
            "attribution_text": f"Data provided by City of Cape Town Open Data Portal"
        },
        "current_status": health,
        "category": _categorize_dataset(dataset_name),
        "checked_at": datetime.utcnow().isoformat()
    }


@router.get("/validate/{dataset_name}")
async def validate_dataset(dataset_name: str, force_refresh: bool = Query(False)):
    """
    Validate a specific dataset for data quality.
    Checks geometry validity, completeness, and spatial integrity.
    """
    if dataset_name not in settings.DATA_URLS:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_name}' not configured")

    try:
        gdf = data_loader.get_gdf(dataset_name, force_refresh=force_refresh)
        validation = data_loader.validate_gdf(gdf, dataset_name)

        return {
            "dataset": dataset_name,
            "validation": validation.to_dict(),
            "source_url": settings.DATA_URLS[dataset_name],
            "validated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Validation failed for {dataset_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _categorize_dataset(name: str) -> str:
    """Categorize dataset by name."""
    categories = {
        "transport": ["myciti", "rail", "transport"],
        "services": ["clinics", "schools", "facilities", "water", "electricity"],
        "environment": ["flood", "parks", "open_spaces"],
        "boundaries": ["suburbs", "zoning"],
        "utilities": ["waste", "recycling"],
        "infrastructure": ["buildings", "courts", "housing", "trading"]
    }

    name_lower = name.lower()
    for category, keywords in categories.items():
        if any(kw in name_lower for kw in keywords):
            return category

    return "other"


def _get_provider(url: str) -> str:
    """Determine data provider from URL."""
    if "capetown.gov.za" in url or "cct::" in url:
        return "City of Cape Town"
    elif "arcgis.com" in url:
        return "City of Cape Town (via ArcGIS)"
    else:
        return "Government Open Data"
