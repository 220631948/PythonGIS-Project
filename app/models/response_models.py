"""
Shared Pydantic response models for Cape Town GeoHub API.

These models serve as response_model annotations on FastAPI routes,
providing automatic OpenAPI schema generation and response validation.
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


# ============= Health & Status Responses =============


class HealthResponse(BaseModel):
    """Simple health check response."""

    status: str = Field(..., examples=["online"])
    database: str = Field(..., examples=["connected"])
    version: str = Field(..., examples=["1.0.0"])


class SystemMemory(BaseModel):
    total: int
    available: int
    percent: float


class SystemDisk(BaseModel):
    total: int
    free: int
    percent: float


class SystemInfo(BaseModel):
    cpu_percent: float
    memory: SystemMemory
    disk: SystemDisk


class DetailedHealthResponse(BaseModel):
    """Detailed system health response with resource metrics."""

    status: str
    version: str
    timestamp: float
    uptime: float
    system: SystemInfo
    requests: Dict[str, Any]
    errors: Dict[str, Any]


class StatsResponse(BaseModel):
    """System statistics response."""

    request_stats: Dict[str, int]
    error_stats: Dict[str, int]
    timestamp: float


class ConfigResponse(BaseModel):
    """Application configuration response (non-sensitive)."""

    app_name: str
    version: str
    debug: bool
    api_prefix: str
    cors_origins: List[str]
    host: str
    port: int


class CacheClearResponse(BaseModel):
    """Cache clear operation response."""

    message: str
    entries_evicted: int


# ============= GeoJSON Pagination =============


class PaginationMetadata(BaseModel):
    """Pagination metadata for paginated responses."""

    total: int
    limit: int
    offset: int
    returned: int
    has_more: Optional[bool] = None


class PaginatedGeoResponse(BaseModel):
    """Paginated GeoJSON FeatureCollection with metadata."""

    type: str = "FeatureCollection"
    features: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: PaginationMetadata


# ============= Error Responses =============


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str


class PartialOutageResponse(BaseModel):
    """Partial outage health response."""

    status: str = "partial_outage"
    database: str = "disconnected"
    error: str
