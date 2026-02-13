"""
Workspace Schemas - Validation for collaborative workspace items
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from .spatial import GeoJSONGeometry

class WorkspaceItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    item_type: str = Field(..., description="Type of item: shadow, suitability, viewshed, etc.")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Parameters and analysis results")
    geom: Optional[GeoJSONGeometry] = Field(default=None, description="Spatial geometry associated with the item")

class WorkspaceItemCreate(WorkspaceItemBase):
    """Schema for creating a new workspace item"""
    pass

class WorkspaceItemUpdate(BaseModel):
    """Schema for updating an existing workspace item"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    data: Optional[Dict[str, Any]] = None

class WorkspaceItem(WorkspaceItemBase):
    """Full workspace item model with database metadata"""
    id: int
    tenant_id: int
    user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
