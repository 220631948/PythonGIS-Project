"""
Metadata Models - Pydantic models for searchable spatial metadata catalog

Supports:
- Dataset metadata with source, update frequency, geometry types
- Attribute search and discovery
- Spatial query filters
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum


class GeometryType(str, Enum):
    """GeoJSON geometry types"""
    POINT = "Point"
    MULTIPOINT = "MultiPoint"
    LINESTRING = "LineString"
    MULTILINESTRING = "MultiLineString"
    POLYGON = "Polygon"
    MULTIPOLYGON = "MultiPolygon"
    GEOMETRY_COLLECTION = "GeometryCollection"


class UpdateFrequency(str, Enum):
    """Data update frequency"""
    REALTIME = "realtime"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    AS_NEEDED = "as_needed"
    STATIC = "static"


class DataQuality(str, Enum):
    """Data quality rating"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


class AttributeMetadata(BaseModel):
    """Metadata for a single attribute/column"""
    name: str
    display_name: Optional[str] = None
    data_type: str  # string, number, date, boolean
    description: Optional[str] = None
    nullable: bool = True
    unique_values: Optional[List[Any]] = None  # For categorical
    min_value: Optional[float] = None  # For numeric
    max_value: Optional[float] = None
    sample_values: Optional[List[Any]] = None


class SpatialExtent(BaseModel):
    """Spatial extent (bounding box)"""
    min_lon: float
    min_lat: float
    max_lon: float
    max_lat: float

    @property
    def as_list(self) -> List[float]:
        return [self.min_lon, self.min_lat, self.max_lon, self.max_lat]


class DatasetMetadata(BaseModel):
    """Comprehensive metadata for a spatial dataset"""
    id: str
    name: str
    title: str
    description: Optional[str] = None

    # Source information
    source: str = Field(default="City of Cape Town Open Data Portal")
    source_url: Optional[str] = None
    license: str = Field(default="Open Data License")
    attribution: Optional[str] = None

    # Spatial information
    geometry_type: GeometryType
    crs: str = Field(default="EPSG:4326")
    extent: Optional[SpatialExtent] = None
    feature_count: int = 0

    # Temporal information
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    temporal_extent_start: Optional[datetime] = None
    temporal_extent_end: Optional[datetime] = None
    update_frequency: UpdateFrequency = Field(default=UpdateFrequency.AS_NEEDED)

    # Schema information
    attributes: List[AttributeMetadata] = Field(default_factory=list)
    primary_key: Optional[str] = None

    # Quality and usability
    quality: DataQuality = Field(default=DataQuality.UNKNOWN)
    completeness: Optional[float] = Field(default=None, ge=0, le=100)

    # Discovery
    keywords: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    # Access
    is_public: bool = True
    requires_auth: bool = False
    api_endpoint: Optional[str] = None
    download_formats: List[str] = Field(default=["geojson", "csv"])


class MetadataSearchQuery(BaseModel):
    """Query for searching the metadata catalog"""
    q: Optional[str] = Field(default=None, description="Free text search")
    keywords: Optional[List[str]] = None
    geometry_type: Optional[GeometryType] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    bbox: Optional[List[float]] = Field(default=None, description="[minLng, minLat, maxLng, maxLat]")
    update_frequency: Optional[UpdateFrequency] = None
    updated_after: Optional[datetime] = None
    has_attribute: Optional[str] = Field(default=None, description="Filter by attribute name")
    min_features: Optional[int] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class MetadataSearchResult(BaseModel):
    """Search result from metadata catalog"""
    datasets: List[DatasetMetadata]
    total: int
    page: int
    page_size: int
    query_time_ms: float


class AttributeSearchQuery(BaseModel):
    """Query for searching within dataset attributes"""
    dataset: str
    attribute: str
    query: Optional[str] = None  # Text search
    values: Optional[List[Any]] = None  # Exact match
    range_min: Optional[float] = None
    range_max: Optional[float] = None
    limit: int = Field(default=100, ge=1, le=1000)


class CatalogStats(BaseModel):
    """Statistics about the metadata catalog"""
    total_datasets: int
    total_features: int
    by_geometry_type: Dict[str, int]
    by_category: Dict[str, int]
    by_update_frequency: Dict[str, int]
    last_updated: datetime
