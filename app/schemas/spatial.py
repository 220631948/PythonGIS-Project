"""
Pydantic Schemas for Spatial Data Validation

Provides comprehensive input validation for spatial endpoints including:
- Coordinate validation (lat/lng bounds)
- Geometry validation (WKT, GeoJSON)
- Bounding box validation
- Spatial query validation

Sprint 3 - Phase D.2.1
"""

from typing import Optional, List, Union, Any, Dict
from pydantic import BaseModel, Field, field_validator, model_validator
from enum import Enum


# ==========================================
# COORDINATE VALIDATION
# ==========================================

class CoordinateSchema(BaseModel):
    """Single coordinate pair with validation"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude (-90 to 90)")
    lng: float = Field(..., ge=-180, le=180, description="Longitude (-180 to 180)")

    class Config:
        json_schema_extra = {
            "example": {
                "lat": -33.9249,
                "lng": 18.4241
            }
        }


class BoundsSchema(BaseModel):
    """Bounding box validation for map extent queries"""
    min_lat: float = Field(..., ge=-90, le=90, description="Minimum latitude")
    min_lng: float = Field(..., ge=-180, le=180, description="Minimum longitude")
    max_lat: float = Field(..., ge=-90, le=90, description="Maximum latitude")
    max_lng: float = Field(..., ge=-180, le=180, description="Maximum longitude")

    @model_validator(mode='after')
    def validate_bounds(self):
        """Ensure max values are greater than min values"""
        if self.max_lat <= self.min_lat:
            raise ValueError("max_lat must be greater than min_lat")
        if self.max_lng <= self.min_lng:
            raise ValueError("max_lng must be greater than min_lng")

        # Check for reasonable bounds size (prevent DOS with huge queries)
        lat_diff = self.max_lat - self.min_lat
        lng_diff = self.max_lng - self.min_lng

        if lat_diff > 10 or lng_diff > 10:
            raise ValueError(
                "Bounding box too large (max 10 degrees in each direction). "
                f"Current: {lat_diff}° × {lng_diff}°"
            )

        return self

    class Config:
        json_schema_extra = {
            "example": {
                "min_lat": -34.0,
                "min_lng": 18.0,
                "max_lat": -33.8,
                "max_lng": 18.6
            }
        }


# ==========================================
# GEOMETRY TYPE VALIDATION
# ==========================================

class GeometryType(str, Enum):
    """Supported geometry types"""
    POINT = "Point"
    LINE_STRING = "LineString"
    POLYGON = "Polygon"
    MULTI_POINT = "MultiPoint"
    MULTI_LINE_STRING = "MultiLineString"
    MULTI_POLYGON = "MultiPolygon"
    GEOMETRY_COLLECTION = "GeometryCollection"


class GeoJSONGeometry(BaseModel):
    """GeoJSON geometry validation"""
    type: GeometryType
    coordinates: Union[
        List[float],  # Point
        List[List[float]],  # LineString, MultiPoint
        List[List[List[float]]],  # Polygon, MultiLineString
        List[List[List[List[float]]]],  # MultiPolygon
    ]

    @field_validator('coordinates')
    @classmethod
    def validate_coordinates(cls, v, info):
        """Validate coordinate structure based on geometry type"""
        geom_type = info.data.get('type')

        if geom_type == GeometryType.POINT:
            if not isinstance(v, list) or len(v) != 2:
                raise ValueError("Point coordinates must be [lng, lat]")
            lng, lat = v
            if not (-180 <= lng <= 180 and -90 <= lat <= 90):
                raise ValueError(f"Invalid coordinates: lng={lng}, lat={lat}")

        elif geom_type == GeometryType.LINE_STRING:
            if not isinstance(v, list) or len(v) < 2:
                raise ValueError("LineString must have at least 2 points")
            for point in v:
                if len(point) != 2:
                    raise ValueError("Each point must be [lng, lat]")

        elif geom_type == GeometryType.POLYGON:
            if not isinstance(v, list) or len(v) < 1:
                raise ValueError("Polygon must have at least one ring")
            for ring in v:
                if len(ring) < 4:
                    raise ValueError("Polygon ring must have at least 4 points")
                if ring[0] != ring[-1]:
                    raise ValueError("Polygon ring must be closed (first point = last point)")

        return v

    class Config:
        json_schema_extra = {
            "example": {
                "type": "Point",
                "coordinates": [18.4241, -33.9249]
            }
        }


class GeoJSONFeature(BaseModel):
    """GeoJSON Feature validation"""
    type: str = Field("Feature", pattern="^Feature$")
    geometry: GeoJSONGeometry
    properties: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [18.4241, -33.9249]
                },
                "properties": {
                    "name": "Cape Town City Centre",
                    "population": 433688
                }
            }
        }


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection validation"""
    type: str = Field("FeatureCollection", pattern="^FeatureCollection$")
    features: List[GeoJSONFeature] = Field(..., max_length=10000)

    @field_validator('features')
    @classmethod
    def validate_feature_count(cls, v):
        """Limit feature count to prevent DOS"""
        if len(v) > 10000:
            raise ValueError("Maximum 10,000 features allowed per request")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [18.4241, -33.9249]
                        },
                        "properties": {"name": "Location 1"}
                    }
                ]
            }
        }


# ==========================================
# SPATIAL QUERY SCHEMAS
# ==========================================

class BufferRequest(BaseModel):
    """Buffer operation request"""
    geometry: GeoJSONGeometry
    distance: float = Field(..., gt=0, le=100000, description="Buffer distance in meters")
    resolution: int = Field(16, ge=4, le=64, description="Number of segments per quadrant")

    @field_validator('distance')
    @classmethod
    def validate_distance(cls, v):
        """Ensure reasonable buffer distances"""
        if v > 100000:  # 100km max
            raise ValueError("Buffer distance cannot exceed 100,000 meters (100 km)")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "geometry": {
                    "type": "Point",
                    "coordinates": [18.4241, -33.9249]
                },
                "distance": 1000,
                "resolution": 16
            }
        }


class IntersectionRequest(BaseModel):
    """Intersection query request"""
    geometry: GeoJSONGeometry
    layer_name: str = Field(..., min_length=1, max_length=100)
    return_geometry: bool = Field(True, description="Include geometry in response")
    limit: int = Field(1000, ge=1, le=10000, description="Maximum results to return")

    class Config:
        json_schema_extra = {
            "example": {
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[18.4, -33.9], [18.5, -33.9], [18.5, -34.0], [18.4, -34.0], [18.4, -33.9]]]
                },
                "layer_name": "suburbs",
                "return_geometry": True,
                "limit": 100
            }
        }


class NearestRequest(BaseModel):
    """Nearest neighbor query"""
    point: CoordinateSchema
    layer_name: str = Field(..., min_length=1, max_length=100)
    limit: int = Field(10, ge=1, le=100, description="Number of nearest features")
    max_distance: Optional[float] = Field(None, gt=0, le=50000, description="Max distance in meters")

    class Config:
        json_schema_extra = {
            "example": {
                "point": {"lat": -33.9249, "lng": 18.4241},
                "layer_name": "service_facilities",
                "limit": 5,
                "max_distance": 5000
            }
        }


class SpatialJoinRequest(BaseModel):
    """Spatial join operation"""
    source_layer: str = Field(..., min_length=1, max_length=100)
    target_layer: str = Field(..., min_length=1, max_length=100)
    operation: str = Field(..., pattern="^(intersects|within|contains|overlaps)$")
    attributes: Optional[List[str]] = Field(None, max_length=50)

    class Config:
        json_schema_extra = {
            "example": {
                "source_layer": "suburbs",
                "target_layer": "service_facilities",
                "operation": "contains",
                "attributes": ["name", "type", "capacity"]
            }
        }


# ==========================================
# ROUTE & NETWORK ANALYSIS
# ==========================================

class RouteRequest(BaseModel):
    """Route calculation request"""
    origin: CoordinateSchema
    destination: CoordinateSchema
    mode: str = Field("driving", pattern="^(driving|walking|cycling)$")
    avoid: Optional[List[str]] = Field(None, max_length=10)

    @model_validator(mode='after')
    def validate_distance(self):
        """Ensure origin and destination are not too far apart"""
        import math

        # Haversine distance calculation
        lat1, lng1 = math.radians(self.origin.lat), math.radians(self.origin.lng)
        lat2, lng2 = math.radians(self.destination.lat), math.radians(self.destination.lng)

        dlat = lat2 - lat1
        dlng = lng2 - lng1

        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance_km = 6371 * c

        if distance_km > 500:  # 500km max
            raise ValueError(
                f"Route distance too large ({distance_km:.1f} km). "
                "Maximum 500 km allowed."
            )

        return self

    class Config:
        json_schema_extra = {
            "example": {
                "origin": {"lat": -33.9249, "lng": 18.4241},
                "destination": {"lat": -33.9100, "lng": 18.4300},
                "mode": "driving",
                "avoid": ["tolls"]
            }
        }


class IsochroneRequest(BaseModel):
    """Isochrone/service area request"""
    point: CoordinateSchema
    time_minutes: int = Field(..., ge=1, le=120, description="Travel time in minutes")
    mode: str = Field("driving", pattern="^(driving|walking|cycling)$")
    resolution: int = Field(100, ge=10, le=500, description="Grid resolution")

    class Config:
        json_schema_extra = {
            "example": {
                "point": {"lat": -33.9249, "lng": 18.4241},
                "time_minutes": 15,
                "mode": "driving",
                "resolution": 100
            }
        }


# ==========================================
# DATA EXPORT SCHEMAS
# ==========================================

class ExportFormat(str, Enum):
    """Supported export formats"""
    GEOJSON = "geojson"
    SHAPEFILE = "shapefile"
    KML = "kml"
    CSV = "csv"
    GEOPACKAGE = "gpkg"


class ExportRequest(BaseModel):
    """Data export request"""
    layer_name: str = Field(..., min_length=1, max_length=100)
    format: ExportFormat
    bounds: Optional[BoundsSchema] = None
    attributes: Optional[List[str]] = Field(None, max_length=100)
    filters: Optional[Dict[str, Any]] = None
    limit: int = Field(10000, ge=1, le=50000)

    class Config:
        json_schema_extra = {
            "example": {
                "layer_name": "suburbs",
                "format": "geojson",
                "bounds": {
                    "min_lat": -34.0,
                    "min_lng": 18.0,
                    "max_lat": -33.8,
                    "max_lng": 18.6
                },
                "limit": 1000
            }
        }


# ==========================================
# ANALYSIS SCHEMAS
# ==========================================

class DensityAnalysisRequest(BaseModel):
    """Point density heatmap request"""
    layer_name: str = Field(..., min_length=1, max_length=100)
    bounds: BoundsSchema
    cell_size: float = Field(..., gt=0, le=1000, description="Cell size in meters")
    radius: float = Field(..., gt=0, le=10000, description="Search radius in meters")

    @field_validator('cell_size')
    @classmethod
    def validate_cell_size(cls, v):
        """Ensure reasonable cell sizes"""
        if v < 10:
            raise ValueError("Cell size too small (minimum 10 meters)")
        if v > 1000:
            raise ValueError("Cell size too large (maximum 1000 meters)")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "layer_name": "crime_incidents",
                "bounds": {
                    "min_lat": -34.0,
                    "min_lng": 18.0,
                    "max_lat": -33.8,
                    "max_lng": 18.6
                },
                "cell_size": 100,
                "radius": 500
            }
        }


class ClusterRequest(BaseModel):
    """
    Point clustering request using PostGIS ST_ClusterKMeans

    Consistent with DensityAnalysisRequest for validation patterns.
    Sprint 3 - E.2.1: GeoJSON Clustering
    """
    layer_name: str = Field(..., min_length=1, max_length=100)
    bounds: BoundsSchema
    num_clusters: int = Field(
        default=10,
        ge=2,
        le=100,
        description="Number of clusters (K in K-Means)"
    )
    zoom_level: Optional[int] = Field(
        default=None,
        ge=0,
        le=20,
        description="Map zoom level for adaptive clustering"
    )

    @field_validator('num_clusters')
    @classmethod
    def validate_num_clusters(cls, v):
        """Ensure reasonable cluster counts"""
        if v < 2:
            raise ValueError("Minimum 2 clusters required")
        if v > 100:
            raise ValueError("Maximum 100 clusters allowed (performance limit)")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "layer_name": "clinics",
                "bounds": {
                    "min_lat": -34.0,
                    "min_lng": 18.0,
                    "max_lat": -33.8,
                    "max_lng": 18.6
                },
                "num_clusters": 15,
                "zoom_level": 12
            }
        }


class StatisticsRequest(BaseModel):
    """Spatial statistics request"""
    layer_name: str = Field(..., min_length=1, max_length=100)
    attribute: str = Field(..., min_length=1, max_length=100)
    bounds: Optional[BoundsSchema] = None
    group_by: Optional[str] = Field(None, max_length=100)

    class Config:
        json_schema_extra = {
            "example": {
                "layer_name": "land_parcels",
                "attribute": "area_sqm",
                "bounds": {
                    "min_lat": -34.0,
                    "min_lng": 18.0,
                    "max_lat": -33.8,
                    "max_lng": 18.6
                },
                "group_by": "zone_type"
            }
        }
