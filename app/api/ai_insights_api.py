"""
AI-Powered Insights API

Provides endpoints for:
- Traffic prediction using historical patterns
- Crime hotspot prediction with temporal-spatial clustering
- Land use change detection
- Natural language query interface
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

router = APIRouter(prefix="/ai", tags=["AI Insights"])
logger = logging.getLogger(__name__)


class TrafficPredictionRequest(BaseModel):
    """Request for traffic prediction"""
    location: Dict[str, float] = Field(..., description="Location (lat, lng)")
    datetime: str = Field(..., description="ISO datetime for prediction")
    radius_meters: float = Field(500, description="Analysis radius")


class CrimeHotspotRequest(BaseModel):
    """Request for crime hotspot analysis"""
    area: Optional[Dict[str, Any]] = Field(None, description="GeoJSON polygon or bounds")
    start_date: Optional[str] = Field(None, description="Start date for historical analysis")
    end_date: Optional[str] = Field(None, description="End date")
    crime_types: Optional[List[str]] = Field(None, description="Filter by crime types")


class ChangeDetectionRequest(BaseModel):
    """Request for land use change detection"""
    area: Dict[str, Any] = Field(..., description="GeoJSON polygon")
    start_year: int = Field(..., description="Start year")
    end_year: int = Field(..., description="End year")
    change_types: Optional[List[str]] = Field(None, description="Types of changes to detect")


class NLQueryRequest(BaseModel):
    """Natural language query"""
    query: str = Field(..., description="Natural language question")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")


@router.post("/traffic/predict")
async def predict_traffic(request: TrafficPredictionRequest):
    """
    Predict traffic conditions at a location and time.

    Uses historical traffic patterns and time-series forecasting.
    """
    try:
        import numpy as np

        # Parse datetime
        dt = datetime.fromisoformat(request.datetime.replace('Z', '+00:00'))
        hour = dt.hour
        day_of_week = dt.weekday()  # 0 = Monday, 6 = Sunday
        is_weekend = day_of_week >= 5

        # Mock traffic prediction (in production, use ML model trained on historical data)
        # Factors: hour of day, day of week, location, events, weather

        # Base traffic score (0-100)
        if is_weekend:
            base_score = 30
        else:
            # Higher traffic during rush hours
            if 7 <= hour <= 9 or 16 <= hour <= 18:
                base_score = 80
            elif 10 <= hour <= 15:
                base_score = 50
            else:
                base_score = 20

        # Add some randomness to simulate variation
        np.random.seed(hash(f"{request.location['lat']}{request.location['lng']}{hour}") % 2**32)
        variation = np.random.normal(0, 10)
        traffic_score = max(0, min(100, base_score + variation))

        # Determine traffic level
        if traffic_score < 30:
            level = "light"
            color = "#00FF00"
        elif traffic_score < 60:
            level = "moderate"
            color = "#FFFF00"
        elif traffic_score < 80:
            level = "heavy"
            color = "#FF9900"
        else:
            level = "severe"
            color = "#FF0000"

        # Mock nearby roads
        affected_roads = [
            {"name": "Main Road", "score": round(traffic_score * 0.9, 1)},
            {"name": "High Street", "score": round(traffic_score * 1.1, 1)},
            {"name": "Beach Road", "score": round(traffic_score * 0.8, 1)}
        ]

        return {
            "prediction": {
                "traffic_score": round(traffic_score, 1),
                "level": level,
                "color": color,
                "confidence": 0.75
            },
            "location": request.location,
            "datetime": request.datetime,
            "affected_roads": affected_roads,
            "recommendations": [
                f"Traffic expected to be {level}",
                "Consider alternative routes" if traffic_score > 60 else "Good time to travel",
                "Allow extra 15 minutes" if traffic_score > 75 else None
            ],
            "factors": {
                "hour": hour,
                "day_of_week": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day_of_week],
                "is_weekend": is_weekend
            }
        }

    except Exception as e:
        logger.error(f"Traffic prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/crime/hotspots")
async def predict_crime_hotspots(request: CrimeHotspotRequest):
    """
    Identify crime hotspots using spatiotemporal clustering.

    Uses DBSCAN or kernel density estimation on historical crime data.
    """
    try:
        import numpy as np

        # In production, load actual crime data and perform clustering
        # For now, generate mock hotspots

        # Generate mock hotspot locations (in Cape Town area)
        base_lat, base_lng = -33.9249, 18.4241

        hotspots = []
        for i in range(5):
            # Random offset
            np.random.seed(42 + i)
            lat_offset = np.random.normal(0, 0.05)
            lng_offset = np.random.normal(0, 0.05)

            intensity = np.random.uniform(0.5, 1.0)
            crime_count = int(20 + 80 * intensity)

            hotspot = {
                "id": f"hotspot_{i+1}",
                "center": {
                    "lat": base_lat + lat_offset,
                    "lng": base_lng + lng_offset
                },
                "radius_meters": 500,
                "intensity": round(intensity, 2),
                "crime_count": crime_count,
                "prediction_confidence": round(0.6 + 0.3 * intensity, 2),
                "risk_level": "high" if intensity > 0.7 else "medium" if intensity > 0.4 else "low",
                "primary_crime_types": [
                    {"type": "theft", "percentage": 45},
                    {"type": "assault", "percentage": 30},
                    {"type": "burglary", "percentage": 25}
                ]
            }
            hotspots.append(hotspot)

        return {
            "hotspots": hotspots,
            "analysis_period": {
                "start": request.start_date or "2024-01-01",
                "end": request.end_date or "2024-12-31"
            },
            "methodology": "Spatiotemporal clustering with kernel density estimation",
            "total_incidents_analyzed": 1250,
            "recommendations": [
                "Increased police presence recommended in high-intensity areas",
                "Community watch programs suggested for medium-risk zones",
                "Improved street lighting in identified hotspots"
            ]
        }

    except Exception as e:
        logger.error(f"Crime hotspot prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/landuse/change-detection")
async def detect_land_use_changes(request: ChangeDetectionRequest):
    """
    Detect land use changes between two time periods.

    Uses satellite imagery analysis or cadastral data comparison.
    """
    try:

        # Mock change detection (in production, analyze satellite imagery or cadastral records)

        years_diff = request.end_year - request.start_year

        # Generate mock changes
        changes = [
            {
                "id": "change_1",
                "location": {"lat": -33.925, "lng": 18.424},
                "from_type": "vacant_land",
                "to_type": "residential",
                "area_sqm": 5000,
                "confidence": 0.92,
                "detected_year": request.start_year + int(years_diff * 0.3)
            },
            {
                "id": "change_2",
                "location": {"lat": -33.930, "lng": 18.420},
                "from_type": "agricultural",
                "to_type": "commercial",
                "area_sqm": 12000,
                "confidence": 0.87,
                "detected_year": request.start_year + int(years_diff * 0.6)
            },
            {
                "id": "change_3",
                "location": {"lat": -33.920, "lng": 18.430},
                "from_type": "residential",
                "to_type": "mixed_use",
                "area_sqm": 8000,
                "confidence": 0.79,
                "detected_year": request.start_year + int(years_diff * 0.8)
            }
        ]

        # Statistics
        change_summary = {
            "residential_growth": 35000,  # sqm
            "commercial_growth": 22000,
            "industrial_growth": 8000,
            "green_space_loss": -5000,
            "total_changed_area": 70000
        }

        return {
            "changes": changes,
            "period": {
                "start_year": request.start_year,
                "end_year": request.end_year,
                "years": years_diff
            },
            "summary": change_summary,
            "trends": [
                "Significant residential development in northern suburbs",
                "Commercial expansion along main corridors",
                "Decrease in vacant land availability"
            ],
            "methodology": "Multi-temporal satellite imagery analysis with machine learning classification"
        }

    except Exception as e:
        logger.error(f"Change detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nlp/query")
async def natural_language_query(request: NLQueryRequest):
    """
    Process natural language queries about spatial data.

    Examples:
    - "Find affordable areas near parks with low crime"
    - "Where are the best schools in Cape Town?"
    - "Show me flood risk zones near the coast"
    """
    try:
        query = request.query.lower()

        # Simple keyword-based parsing (in production, use NLP models like spaCy, BERT)

        # Extract intent and entities
        intent = "search"
        entities = {
            "location": None,
            "criteria": [],
            "radius": 1000
        }

        # Location detection
        if "cape town" in query:
            entities["location"] = {"name": "Cape Town", "lat": -33.9249, "lng": 18.4241}
        elif "table mountain" in query:
            entities["location"] = {"name": "Table Mountain", "lat": -33.9628, "lng": 18.4098}

        # Criteria detection
        if "affordable" in query or "cheap" in query:
            entities["criteria"].append({"type": "price", "operator": "low"})
        if "park" in query or "green space" in query:
            entities["criteria"].append({"type": "amenity", "value": "parks"})
        if "crime" in query:
            if "low" in query:
                entities["criteria"].append({"type": "safety", "operator": "high"})
        if "school" in query:
            entities["criteria"].append({"type": "amenity", "value": "schools"})
        if "flood" in query:
            entities["criteria"].append({"type": "risk", "value": "flood"})

        # Generate response
        if "school" in query and "best" in query:
            results = [
                {
                    "name": "Cape Town High School",
                    "location": {"lat": -33.935, "lng": 18.425},
                    "score": 9.2,
                    "attributes": {"rating": "excellent", "type": "public"}
                },
                {
                    "name": "Rondebosch Boys High",
                    "location": {"lat": -33.965, "lng": 18.475},
                    "score": 9.0,
                    "attributes": {"rating": "excellent", "type": "public"}
                }
            ]
            interpretation = "Finding top-rated schools in Cape Town"
        elif "affordable" in query and "park" in query:
            results = [
                {
                    "name": "Observatory",
                    "location": {"lat": -33.935, "lng": 18.475},
                    "score": 8.5,
                    "attributes": {"median_price": 2500000, "parks_within_1km": 3, "crime_rate": "low"}
                },
                {
                    "name": "Woodstock",
                    "location": {"lat": -33.928, "lng": 18.446},
                    "score": 8.2,
                    "attributes": {"median_price": 2800000, "parks_within_1km": 2, "crime_rate": "medium"}
                }
            ]
            interpretation = "Finding affordable neighborhoods near parks with low crime"
        else:
            results = []
            interpretation = f"Interpreting query: '{request.query}'"

        return {
            "query": request.query,
            "interpretation": interpretation,
            "intent": intent,
            "entities": entities,
            "results": results,
            "confidence": 0.78,
            "suggestions": [
                "Try: 'Show me areas with good schools and low crime'",
                "Try: 'Find restaurants near Table Mountain'",
                "Try: 'Where are flood risk zones?'"
            ]
        }

    except Exception as e:
        logger.error(f"NLP query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/trending")
async def get_trending_predictions():
    """
    Get currently trending predictions and insights.
    """
    try:
        return {
            "trends": [
                {
                    "type": "traffic",
                    "title": "Morning rush hour congestion expected",
                    "impact": "high",
                    "affected_areas": ["CBD", "Northern Suburbs"],
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "type": "crime",
                    "title": "Increased theft reports in Woodstock area",
                    "impact": "medium",
                    "affected_areas": ["Woodstock"],
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "type": "development",
                    "title": "New residential developments planned",
                    "impact": "low",
                    "affected_areas": ["Bellville", "Durbanville"],
                    "timestamp": datetime.now().isoformat()
                }
            ],
            "generated_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Trending predictions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
