"""
Tenant Management API

Provides endpoints for managing tenants (super admin only).
"""

from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.auth import Tenant
from app.schemas.auth import Tenant as TenantSchema, TenantCreate
from app.core.rbac import RoleChecker, Role

router = APIRouter(prefix="/tenants", tags=["Tenant Management"])

@router.get("", response_model=List[TenantSchema])
async def list_tenants(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(RoleChecker(Role.SUPER_ADMIN))
) -> Any:
    """
    List all tenants. Super admin only.
    """
    result = await db.execute(select(Tenant))
    return result.scalars().all()

@router.post("", response_model=TenantSchema, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_in: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(RoleChecker(Role.SUPER_ADMIN))
) -> Any:
    """
    Create a new tenant. Super admin only.
    """
    result = await db.execute(select(Tenant).where(Tenant.name == tenant_in.name))
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="A tenant with this name already exists."
        )
    
    tenant = Tenant(**tenant_in.dict())
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant

@router.get("/{tenant_id}", response_model=TenantSchema)
async def get_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(RoleChecker(Role.SUPER_ADMIN))
) -> Any:
    """
    Get tenant by ID. Super admin only.
    """
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalars().first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant
