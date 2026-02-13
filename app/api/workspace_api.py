"""
Project Workspace & Scenarios API

Provides endpoints for:
- Save multiple analysis scenarios
- Project folders with organized layers
- Team workspace sharing
- Version control for spatial edits
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional, Dict, Any
import logging

from app.dependencies import get_db_with_rls
from app.models.sql_models import WorkspaceItem as WorkspaceItemModel
from app.schemas.workspace import WorkspaceItem, WorkspaceItemCreate, WorkspaceItemUpdate
from shapely.geometry import shape
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import mapping

router = APIRouter(prefix="/workspace", tags=["Project Workspace"])
logger = logging.getLogger(__name__)


@router.post("/items", response_model=WorkspaceItem, status_code=status.HTTP_201_CREATED)
async def create_workspace_item(
    item_in: WorkspaceItemCreate,
    db: AsyncSession = Depends(get_db_with_rls)
):
    """
    Create a new workspace item (analysis result, scenario, etc.)
    The tenant_id is automatically injected by the TenantContextMiddleware.
    """
    try:
        geom = None
        if item_in.geom:
            shapely_geom = shape(item_in.geom)
            geom = from_shape(shapely_geom, srid=4326)
            
        db_item = WorkspaceItemModel(
            name=item_in.name,
            item_type=item_in.item_type,
            data=item_in.data,
            geom=geom
        )
        
        db.add(db_item)
        await db.commit()
        await db.refresh(db_item)
        
        # Convert back for response
        response_item = WorkspaceItem.model_validate(db_item)
        if db_item.geom is not None:
            response_item.geom = mapping(to_shape(db_item.geom))
            
        return response_item
    except Exception as e:
        logger.error(f"Workspace item creation error: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/items", response_model=List[WorkspaceItem])
async def list_workspace_items(
    item_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db_with_rls)
):
    """List all workspace items for the current tenant."""
    query = select(WorkspaceItemModel)
    if item_type:
        query = query.where(WorkspaceItemModel.item_type == item_type)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    # Map geometry for GeoJSON
    response_items = []
    for item in items:
        valid_item = WorkspaceItem.model_validate(item)
        if item.geom is not None:
            valid_item.geom = mapping(to_shape(item.geom))
        response_items.append(valid_item)
        
    return response_items


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_item(
    item_id: int,
    db: AsyncSession = Depends(get_db_with_rls)
):
    """Delete a workspace item."""
    stmt = delete(WorkspaceItemModel).where(WorkspaceItemModel.id == item_id)
    await db.execute(stmt)
    await db.commit()
    return None
