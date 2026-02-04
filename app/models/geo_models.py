"""
Pydantic Geo Models for Cape Town GeoHub

Provides Pydantic schemas for validating and serializing GeoJSON data
and spatial analysis results.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Dict, Any, List, Optional, Union, Tuple
from datetime import datetime
from enum import Enum


# ============= GeoJSON Types =============

class GeometryType(str, Enum):
    """GeoJSON geometry types."""
    POINT = "Point"
    MULTIPOINT = "MultiPoint"
    LINESTRING = "LineString"
    MULTILINESTRING = "MultiLineString"
    POLYGON = "Polygon"
    MULTIPOLYGON = "MultiPolygon"
    GEOMETRYCOLLECTION = "GeometryCollection"


class Geometry(BaseModel):
    """GeoJSON Geometry object."""
    type: GeometryType
    coordinates: Union[List[float], List[List[float]], List[List[List[float]]], List[List[List[List[float]]]]]

    class Config:
        use_enum_values = True


class Feature(BaseModel):
    """GeoJSON Feature object."""
    type: str = "Feature"
    id: Optional[Union[str, int]] = None
    geometry: Optional[Dict[str, Any]] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class FeatureCollection(BaseModel):
    """GeoJSON FeatureCollection object."""
    type: str = "FeatureCollection"
    features: List[Feature] = Field(default_factory=list)

    @property
    def count(self) -> int:
        return len(self.features)


# ============= API Response Models =============

class GeoResponse(BaseModel):
    """Standard GeoJSON response with metadata."""
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @property
    def count(self) -> int:
        return len(self.features)


class SpatialQueryResponse(BaseModel):
    """Response for spatial queries with geometry results."""
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]] = Field(default_factory=list)
    count: int = 0
    query_info: Optional[Dict[str, Any]] = None


class AnalysisResult(BaseModel):
    """Generic analysis result container."""
    status: str
    message: str
    data: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SpatialAnalysisResult(BaseModel):
    """Result of a spatial analysis operation."""
    success: bool
    geojson: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ============= Spatial Query Request Models =============

class PointQuery(BaseModel):
    """Request model for point-based spatial queries."""
    lat: float = Field(..., ge=-90, le=90, description="Latitude in WGS84")
    lon: float = Field(..., ge=-180, le=180, description="Longitude in WGS84")
    radius_meters: Optional[float] = Field(1000, ge=0, le=100000, description="Search radius in meters")


class BoundingBoxQuery(BaseModel):
    """Request model for bounding box queries."""
    min_lon: float = Field(..., ge=-180, le=180)
    min_lat: float = Field(..., ge=-90, le=90)
    max_lon: float = Field(..., ge=-180, le=180)
    max_lat: float = Field(..., ge=-90, le=90)

    @model_validator(mode='after')
    def validate_bbox(self):
        if self.min_lon > self.max_lon:
            raise ValueError("min_lon must be less than max_lon")
        if self.min_lat > self.max_lat:
            raise ValueError("min_lat must be less than max_lat")
        return self


class PolygonQuery(BaseModel):
    """Request model for polygon-based queries."""
    polygon: Dict[str, Any] = Field(..., description="GeoJSON Polygon geometry")

    @field_validator('polygon')
    @classmethod
    def validate_polygon(cls, v):
        if not isinstance(v, dict):
            raise ValueError("polygon must be a GeoJSON geometry object")
        if v.get('type') not in ['Polygon', 'MultiPolygon']:
            raise ValueError("geometry must be a Polygon or MultiPolygon")
        return v


class PointInPolygonRequest(BaseModel):
    """Request for point-in-polygon analysis."""
    polygon: Dict[str, Any] = Field(..., description="GeoJSON Polygon geometry")
    layers: List[str] = Field(..., min_length=1, description="List of layer names to query")


class BufferRequest(BaseModel):
    """Request for buffer creation."""
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    distance_meters: float = Field(500, ge=1, le=50000)


class NearbyFeaturesRequest(BaseModel):
    """Request for finding nearby features."""
    layer: str = Field(..., min_length=1)
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    radius_meters: float = Field(1000, ge=1, le=50000)
    limit: int = Field(100, ge=1, le=1000)


# ============= Layer & Dataset Models =============

class LayerInfo(BaseModel):
    """Information about a spatial layer."""
    id: int
    name: str
    table_name: Optional[str] = None
    layer_type: Optional[str] = None
    description: Optional[str] = None
    source_url: Optional[str] = None
    srid: int = 4326
    record_count: int = 0
    bounds: Optional[List[float]] = None
    last_updated: Optional[datetime] = None
    is_active: bool = True


class LayerListResponse(BaseModel):
    """Response containing list of layers."""
    layers: List[LayerInfo]
    total: int


# ============= Feature Models =============

class SuburbSchema(BaseModel):
    """Schema for suburb data."""
    id: int
    name: str
    official_name: Optional[str] = None
    postal_code: Optional[str] = None
    city: str = "Cape Town"
    subcouncil: Optional[str] = None
    ward: Optional[str] = None
    area_sqkm: Optional[float] = None
    population: Optional[int] = None

    class Config:
        from_attributes = True


class ServiceFacilitySchema(BaseModel):
    """Schema for service facility data."""
    id: int
    name: str
    facility_type: str
    category: Optional[str] = None
    address: Optional[str] = None
    suburb_name: Optional[str] = None
    ward: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class TransportStopSchema(BaseModel):
    """Schema for transport stop data."""
    id: int
    stop_id: Optional[str] = None
    name: str
    stop_type: str
    suburb: Optional[str] = None
    routes: Optional[List[str]] = None
    wheelchair_accessible: Optional[bool] = None

    class Config:
        from_attributes = True


# ============= Suitability Analysis Models =============

class SuitabilityCriterion(BaseModel):
    """Individual suitability criterion configuration."""
    name: str
    weight: float = Field(1.0, ge=0, le=10)
    enabled: bool = True


class SuitabilityRequest(BaseModel):
    """Request for site suitability analysis."""
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    criteria: Optional[List[SuitabilityCriterion]] = None
    radius_meters: float = Field(1000, ge=100, le=10000)


class SuitabilityPolygonRequest(BaseModel):
    """Request for polygon-based suitability analysis."""
    polygon: Dict[str, Any] = Field(..., description="GeoJSON Polygon geometry")
    criteria: Optional[List[SuitabilityCriterion]] = None


class SuitabilityScore(BaseModel):
    """Individual criterion score."""
    criterion: str
    score: float = Field(..., ge=0, le=100)
    weight: float = Field(..., ge=0, le=10)
    weighted_score: float
    details: Optional[Dict[str, Any]] = None


class SuitabilityResult(BaseModel):
    """Result of suitability analysis."""
    overall_score: float = Field(..., ge=0, le=100)
    suitability_class: str  # Excellent, Good, Moderate, Poor
    criteria_scores: List[SuitabilityScore]
    location: Dict[str, Any]  # GeoJSON Point or Polygon
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    recommendations: Optional[List[str]] = None


# ============= Database Status Models =============

class DatabaseStatus(BaseModel):
    """Database connection and health status."""
    connected: bool
    postgis_enabled: bool
    postgis_version: Optional[str] = None
    tables_count: int = 0
    spatial_layers_count: int = 0
    error: Optional[str] = None


class DataSourceHealth(BaseModel):
    """Health status of a data source."""
    dataset: str
    status: str
    accessible: bool
    url: Optional[str] = None
    status_code: Optional[int] = None
    error: Optional[str] = None
    checked_at: datetime


# ============= Vector Tile Models =============

class VectorTileRequest(BaseModel):
    """Request for vector tiles."""
    layer: str
    z: int = Field(..., ge=0, le=22)
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)


class MVTLayerConfig(BaseModel):
    """Configuration for MVT layer."""
    layer_name: str
    table_name: str
    geometry_column: str = "geom"
    id_column: str = "id"
    properties: Optional[List[str]] = None
    min_zoom: int = 0
    max_zoom: int = 22


# Export all schemas
__all__ = [
    "GeometryType",
    "Geometry",
    "Feature",
    "FeatureCollection",
    "GeoResponse",
    "SpatialQueryResponse",
    "AnalysisResult",
    "SpatialAnalysisResult",
    "PointQuery",
    "BoundingBoxQuery",
    "PolygonQuery",
    "PointInPolygonRequest",
    "BufferRequest",
    "NearbyFeaturesRequest",
    "LayerInfo",
    "LayerListResponse",
    "SuburbSchema",
    "ServiceFacilitySchema",
    "TransportStopSchema",
    "SuitabilityCriterion",
    "SuitabilityRequest",
    "SuitabilityPolygonRequest",
    "SuitabilityScore",
    "SuitabilityResult",
    "DatabaseStatus",
    "DataSourceHealth",
    "VectorTileRequest",
    "MVTLayerConfig",
]
