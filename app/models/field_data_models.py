"""
Field Data Models - Pydantic models for mobile/field data capture

Supports:
- Field data capture forms with location, photos, and attributes
- Offline data sync queue
- Field survey configuration
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from enum import Enum
import uuid


class FieldEntryStatus(str, Enum):
    """Status of field data entry"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    SYNCED = "synced"
    VALIDATED = "validated"
    REJECTED = "rejected"


class FieldType(str, Enum):
    """Field input types for forms"""
    TEXT = "text"
    NUMBER = "number"
    SELECT = "select"
    MULTISELECT = "multiselect"
    DATE = "date"
    DATETIME = "datetime"
    PHOTO = "photo"
    SIGNATURE = "signature"
    LOCATION = "location"
    BARCODE = "barcode"
    CHECKBOX = "checkbox"


class FormField(BaseModel):
    """Definition of a form field for field data capture"""
    id: str
    label: str
    field_type: FieldType
    required: bool = False
    default_value: Optional[Any] = None
    options: Optional[List[str]] = None  # For select/multiselect
    validation: Optional[Dict[str, Any]] = None  # min, max, pattern, etc.
    help_text: Optional[str] = None
    order: int = 0


class FieldSurveyForm(BaseModel):
    """Configuration for a field survey form"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    version: str = "1.0"
    fields: List[FormField]
    target_layer: Optional[str] = Field(default=None, description="Layer to add data to")
    geometry_type: str = Field(default="Point", description="Point, LineString, or Polygon")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    offline_enabled: bool = True


class PhotoAttachment(BaseModel):
    """Photo attachment metadata"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    content_type: str = "image/jpeg"
    size_bytes: int
    url: Optional[str] = None  # URL after upload
    thumbnail_url: Optional[str] = None
    location: Optional[Dict[str, float]] = None  # Photo geolocation if available
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    base64_data: Optional[str] = None  # For offline storage


class FieldDataEntry(BaseModel):
    """A single field data capture entry"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    location: Dict[str, float] = Field(..., description="{lat, lng, accuracy}")
    geometry: Optional[Dict[str, Any]] = Field(default=None, description="GeoJSON geometry")
    attributes: Dict[str, Any] = Field(default_factory=dict)
    photos: List[PhotoAttachment] = Field(default_factory=list)
    status: FieldEntryStatus = Field(default=FieldEntryStatus.DRAFT)
    collected_by: str
    collected_at: datetime = Field(default_factory=datetime.utcnow)
    device_info: Optional[Dict[str, str]] = None  # device, OS, app version
    synced_at: Optional[datetime] = None
    offline_id: Optional[str] = Field(default=None, description="Local ID from offline storage")


class FieldDataSubmission(BaseModel):
    """Request to submit field data (single or batch)"""
    entries: List[FieldDataEntry]
    sync_mode: str = Field(default="create", description="create, update, or upsert")


class OfflineSyncQueue(BaseModel):
    """Queue item for offline data sync"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entry: FieldDataEntry
    action: str = "create"  # create, update, delete
    attempts: int = 0
    last_attempt: Optional[datetime] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SyncResult(BaseModel):
    """Result of sync operation"""
    total: int
    synced: int
    failed: int
    errors: List[Dict[str, str]] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class OfflinePackage(BaseModel):
    """Package of data for offline use"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    forms: List[FieldSurveyForm]
    layers: List[Dict[str, Any]] = Field(default_factory=list, description="GeoJSON layers")
    tile_bounds: Optional[List[float]] = Field(default=None, description="[minLng, minLat, maxLng, maxLat]")
    tile_zoom_range: List[int] = Field(default=[10, 16], description="[minZoom, maxZoom]")
    size_estimate_mb: float = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
