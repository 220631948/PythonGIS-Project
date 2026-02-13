import logging
from typing import Generator, Optional
from fastapi import HTTPException, Security, Depends, status, Request
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.core.security import ALGORITHM, SECRET_KEY
from app.schemas.auth import TokenData
from app.models.auth import User
from app.core.database import get_db
from app.core.rls import set_rls_variables

logger = logging.getLogger(__name__)

# --- Admin API Key Authentication ---
_api_key_header = APIKeyHeader(name="X-Admin-API-Key", auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login")

def require_admin_key(api_key: str = Security(_api_key_header)) -> str:
    """FastAPI dependency that enforces admin API key on protected endpoints.

    If ADMIN_API_KEY is not configured (empty string), access is unrestricted
    and a warning is logged on first call.
    """
    expected = settings.ADMIN_API_KEY
    if not expected:
        # No key configured — allow access but warn
        logger.warning(
            "ADMIN_API_KEY not set — admin endpoints are unprotected. "
            "Set ADMIN_API_KEY in .env for production."
        )
        return "unprotected"
    if not api_key or api_key != expected:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing admin API key (X-Admin-API-Key header).",
        )
    return api_key


def get_settings():
    return settings

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    # Async DB query
    result = await db.execute(select(User).where(User.email == token_data.username))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_db_with_rls(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> AsyncSession:
    """
    FastAPI dependency that provides a database session with RLS variables set.

    This dependency:
    1. Gets the database session
    2. Reads tenant_id, user_id, and user_role from request.state (set by TenantContextMiddleware)
    3. Sets PostgreSQL session variables for Row-Level Security
    4. Returns the session ready for tenant-isolated queries

    Usage:
        @router.get("/layers")
        async def get_layers(db: AsyncSession = Depends(get_db_with_rls)):
            # All queries are automatically filtered by tenant_id
            result = await db.execute(select(SpatialLayer))
            return result.scalars().all()
    """
    # Get RLS variables from request state (set by TenantContextMiddleware from JWT)
    tenant_id = getattr(request.state, 'tenant_id', None)
    user_id = getattr(request.state, 'user_id', None)
    user_role = getattr(request.state, 'user_role', None)

    # Set PostgreSQL session variables for RLS policies
    if tenant_id or user_id or user_role:
        await set_rls_variables(
            db,
            tenant_id=tenant_id,
            user_id=user_id,
            user_role=user_role
        )
        logger.debug(f"RLS variables set from request: tenant_id={tenant_id}, user_id={user_id}, role={user_role}")

    return db

