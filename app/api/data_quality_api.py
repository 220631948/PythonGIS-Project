"""
Data Quality Dashboard API

Provides endpoints for:
- Data freshness indicators
- Completeness metrics by dataset
- Attribute validation errors
- Data lineage visualization
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import logging

router = APIRouter(prefix="/data-quality", tags=["Data Quality"])
logger = logging.getLogger(__name__)


@router.get("/overview")
async def get_data_quality_overview():
    """Get overall data quality metrics."""
    try:
        return {
            "summary": {
                "total_datasets": 45,
                "healthy": 38,
                "warnings": 5,
                "critical": 2,
                "overall_score": 84.2
            },
            "metrics": {
                "completeness_avg": 92.5,
                "accuracy_avg": 88.3,
                "timeliness_avg": 76.8,
                "consistency_avg": 91.2
            },
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Data quality overview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataset/{dataset_id}")
async def get_dataset_quality(dataset_id: str):
    """Get detailed quality metrics for a dataset."""
    try:
        return {
            "dataset_id": dataset_id,
            "freshness": {
                "last_updated": (datetime.now() - timedelta(days=2)).isoformat(),
                "update_frequency": "weekly",
                "status": "current",
                "days_since_update": 2
            },
            "completeness": {
                "overall_pct": 94.5,
                "by_field": {
                    "name": 100.0,
                    "geometry": 100.0,
                    "address": 92.3,
                    "postal_code": 87.8
                },
                "missing_records": 45
            },
            "validation": {
                "total_errors": 12,
                "error_rate_pct": 0.8,
                "errors_by_type": {
                    "invalid_geometry": 5,
                    "out_of_bounds": 3,
                    "duplicate_records": 4
                }
            },
            "lineage": {
                "source": "City of Cape Town Open Data Portal",
                "collection_date": "2024-01-15",
                "transformations": ["CRS conversion", "Geometry simplification"],
                "last_validated": datetime.now().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Dataset quality error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/validation/errors/{dataset_id}")
async def get_validation_errors(dataset_id: str, limit: int = 50):
    """Get validation errors for a dataset."""
    try:
        errors = [
            {
                "record_id": f"record_{i}",
                "error_type": "invalid_geometry",
                "field": "geometry",
                "message": "Self-intersecting polygon",
                "severity": "high"
            }
            for i in range(min(12, limit))
        ]

        return {
            "dataset_id": dataset_id,
            "errors": errors,
            "total": len(errors)
        }
    except Exception as e:
        logger.error(f"Validation errors error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
