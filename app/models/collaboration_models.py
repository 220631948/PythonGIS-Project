"""
Collaboration Models - Pydantic models for spatial review and collaboration features

Supports:
- Location-based comments and annotations
- Shared project markers and notes
- Threaded discussions anchored on map features
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
import uuid


class AnnotationType(str, Enum):
    """Types of spatial annotations"""
    COMMENT = "comment"
    NOTE = "note"
    MARKER = "marker"
    ISSUE = "issue"
    SUGGESTION = "suggestion"
    APPROVAL = "approval"


class AnnotationStatus(str, Enum):
    """Status of an annotation"""
    OPEN = "open"
    RESOLVED = "resolved"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class GeoLocation(BaseModel):
    """Geographic location for annotations"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    zoom: Optional[int] = Field(default=15, ge=1, le=22, description="Map zoom level")


class AnnotationCreate(BaseModel):
    """Request model for creating a new annotation"""
    location: GeoLocation
    annotation_type: AnnotationType = Field(default=AnnotationType.COMMENT)
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    author: str = Field(..., min_length=1, max_length=100)
    feature_id: Optional[str] = Field(default=None, description="ID of associated map feature")
    layer_id: Optional[str] = Field(default=None, description="Layer the annotation relates to")
    tags: List[str] = Field(default_factory=list)
    attachments: List[str] = Field(default_factory=list, description="URLs to attached files")


class AnnotationUpdate(BaseModel):
    """Request model for updating an annotation"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    content: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    status: Optional[AnnotationStatus] = None
    tags: Optional[List[str]] = None


class Annotation(BaseModel):
    """Full annotation model with metadata"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location: GeoLocation
    annotation_type: AnnotationType
    title: str
    content: str
    author: str
    feature_id: Optional[str] = None
    layer_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    attachments: List[str] = Field(default_factory=list)
    status: AnnotationStatus = Field(default=AnnotationStatus.OPEN)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    reply_count: int = 0


class ReplyCreate(BaseModel):
    """Request model for creating a reply to an annotation"""
    content: str = Field(..., min_length=1, max_length=2000)
    author: str = Field(..., min_length=1, max_length=100)


class Reply(BaseModel):
    """Reply to an annotation (threaded discussion)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    annotation_id: str
    content: str
    author: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnnotationFilter(BaseModel):
    """Filter criteria for querying annotations"""
    bbox: Optional[List[float]] = Field(default=None, description="[minLng, minLat, maxLng, maxLat]")
    annotation_type: Optional[AnnotationType] = None
    status: Optional[AnnotationStatus] = None
    author: Optional[str] = None
    layer_id: Optional[str] = None
    tags: Optional[List[str]] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


class AnnotationListResponse(BaseModel):
    """Response model for list of annotations"""
    annotations: List[Annotation]
    total: int
    page: int = 1
    page_size: int = 50


class ProjectMarker(BaseModel):
    """Shared project marker for team collaboration"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    location: GeoLocation
    icon: str = Field(default="marker")
    color: str = Field(default="#3388ff")
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    shared_with: List[str] = Field(default_factory=list, description="User IDs or 'public'")
