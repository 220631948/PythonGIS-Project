"""
Advanced Demographic Analysis API

Provides endpoints for:
- Population density heatmaps
- Socioeconomic indicators overlay
- Age distribution and vulnerable population mapping
- Multi-criteria suitability scoring
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict
import logging
import numpy as np

router = APIRouter(prefix="/demographics", tags=["Demographics"])
logger = logging.getLogger(__name__)


class DensityRequest(BaseModel):
    bounds: Dict[str, float]
    resolution: int = Field(50, ge=10, le=200)


@router.post("/density/heatmap")
async def get_population_density(request: DensityRequest):
    """Get population density heatmap for an area."""
    try:
        # Mock density data (in production, use census data)
        grid = []
        for i in range(request.resolution):
            for j in range(request.resolution):
                density = max(0, np.random.normal(100, 50))
                grid.append({
                    "x": i,
                    "y": j,
                    "density": round(density, 2),
                    "population": int(density * 100)
                })

        return {
            "grid": grid,
            "resolution": request.resolution,
            "bounds": request.bounds,
            "statistics": {
                "max_density": max(g["density"] for g in grid),
                "avg_density": sum(g["density"] for g in grid) / len(grid),
                "total_population": sum(g["population"] for g in grid)
            }
        }
    except Exception as e:
        logger.error(f"Density heatmap error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/indicators/{area_id}")
async def get_socioeconomic_indicators(area_id: str):
    """Get socioeconomic indicators for an area."""
    try:
        return {
            "area_id": area_id,
            "indicators": {
                "median_income": 35000,
                "unemployment_rate": 12.5,
                "education_level": {"no_matric": 15, "matric": 45, "tertiary": 40},
                "poverty_rate": 18.3,
                "gini_coefficient": 0.63,
                "housing_quality_index": 72.5
            },
            "demographics": {
                "total_population": 25000,
                "population_density": 1500,
                "median_age": 32,
                "household_size": 3.2
            }
        }
    except Exception as e:
        logger.error(f"Indicators error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/age-distribution/{area_id}")
async def get_age_distribution(area_id: str):
    """Get age distribution for an area."""
    try:
        return {
            "area_id": area_id,
            "age_groups": [
                {"range": "0-5", "count": 2100, "percentage": 8.4},
                {"range": "6-18", "count": 4500, "percentage": 18.0},
                {"range": "19-35", "count": 8500, "percentage": 34.0},
                {"range": "36-60", "count": 7200, "percentage": 28.8},
                {"range": "60+", "count": 2700, "percentage": 10.8}
            ],
            "vulnerable_populations": {
                "children_under_5": 2100,
                "elderly_over_65": 1800,
                "disabled": 1200
            }
        }
    except Exception as e:
        logger.error(f"Age distribution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
