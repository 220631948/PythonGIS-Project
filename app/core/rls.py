"""
Row-Level Security (RLS) Session Management

This module provides SQLAlchemy event listeners to set PostgreSQL session variables
for Row-Level Security policies. These session variables are used by RLS policies
to enforce tenant isolation at the database level.

Session Variables:
- app.current_tenant_id: The tenant_id of the authenticated user
- app.current_user_id: The user_id of the authenticated user
- app.current_user_role: The role of the authenticated user

Usage:
    from app.core.rls import set_rls_variables

    # In your API endpoint:
    async def get_data(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ):
        # Set RLS variables for this session
        await set_rls_variables(db, current_user)

        # Now all queries will be automatically filtered by tenant_id
        result = await db.execute(select(SpatialLayer))
        return result.scalars().all()
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)


async def set_rls_variables(
    session: AsyncSession,
    tenant_id: Optional[int] = None,
    user_id: Optional[int] = None,
    user_role: Optional[str] = None
) -> None:
    """
    Set PostgreSQL session variables for Row-Level Security.

    This function should be called at the beginning of each request that
    accesses tenant-scoped data. It sets session-local variables that are
    used by RLS policies to filter data.

    Args:
        session: SQLAlchemy async session
        tenant_id: The tenant_id to set (from JWT or user object)
        user_id: The user_id to set (from JWT or user object)
        user_role: The user role (e.g., 'super_admin', 'tenant_admin', 'editor', 'viewer')

    Example:
        >>> await set_rls_variables(db, tenant_id=1, user_id=42, user_role='editor')
    """
    try:
        # Set tenant_id (required for tenant isolation)
        if tenant_id is not None:
            await session.execute(
                text("SELECT set_config('app.current_tenant_id', :tenant_id, false)")
                .bindparams(tenant_id=str(tenant_id))
            )

        # Set user_id (optional, for user-level policies)
        if user_id is not None:
            await session.execute(
                text("SELECT set_config('app.current_user_id', :user_id, false)")
                .bindparams(user_id=str(user_id))
            )

        # Set user_role (required for super_admin bypass)
        if user_role is not None:
            await session.execute(
                text("SELECT set_config('app.current_user_role', :user_role, false)")
                .bindparams(user_role=user_role)
            )

        await session.commit()

        logger.debug(
            f"RLS variables set: tenant_id={tenant_id}, user_id={user_id}, role={user_role}"
        )

    except Exception as e:
        logger.error(f"Failed to set RLS variables: {e}")
        raise


async def clear_rls_variables(session: AsyncSession) -> None:
    """
    Clear PostgreSQL session variables for Row-Level Security.

    This is useful for cleaning up after a request or for testing.

    Args:
        session: SQLAlchemy async session
    """
    try:
        await session.execute(text("SELECT set_config('app.current_tenant_id', '', false)"))
        await session.execute(text("SELECT set_config('app.current_user_id', '', false)"))
        await session.execute(text("SELECT set_config('app.current_user_role', '', false)"))
        await session.commit()

        logger.debug("RLS variables cleared")

    except Exception as e:
        logger.error(f"Failed to clear RLS variables: {e}")
        raise


async def get_rls_variables(session: AsyncSession) -> dict:
    """
    Get current PostgreSQL session variables for debugging.

    Args:
        session: SQLAlchemy async session

    Returns:
        Dictionary with current RLS variable values

    Example:
        >>> vars = await get_rls_variables(db)
        >>> print(vars)
        {'tenant_id': '1', 'user_id': '42', 'user_role': 'editor'}
    """
    try:
        result = await session.execute(
            text("""
                SELECT
                    current_setting('app.current_tenant_id', true) as tenant_id,
                    current_setting('app.current_user_id', true) as user_id,
                    current_setting('app.current_user_role', true) as user_role
            """)
        )
        row = result.first()

        return {
            'tenant_id': row[0] if row else None,
            'user_id': row[1] if row else None,
            'user_role': row[2] if row else None,
        }

    except Exception as e:
        logger.error(f"Failed to get RLS variables: {e}")
        return {}


class RLSContext:
    """
    Context manager for setting RLS variables within a scope.

    This is useful for temporarily setting RLS variables for a specific
    operation, then automatically clearing them when done.

    Example:
        >>> async with RLSContext(db, tenant_id=1, user_role='editor'):
        ...     # All queries in this block are filtered by tenant_id=1
        ...     layers = await db.execute(select(SpatialLayer))
    """

    def __init__(
        self,
        session: AsyncSession,
        tenant_id: Optional[int] = None,
        user_id: Optional[int] = None,
        user_role: Optional[str] = None
    ):
        self.session = session
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.user_role = user_role

    async def __aenter__(self):
        await set_rls_variables(
            self.session,
            tenant_id=self.tenant_id,
            user_id=self.user_id,
            user_role=self.user_role
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await clear_rls_variables(self.session)
        return False


# Dependency for FastAPI to automatically set RLS variables from request state
async def auto_set_rls_from_request(
    request,
    session: AsyncSession
) -> AsyncSession:
    """
    FastAPI dependency that automatically sets RLS variables from request state.

    The TenantContextMiddleware sets request.state.tenant_id, user_id, and user_role
    from the JWT token. This dependency reads those values and sets the PostgreSQL
    session variables.

    Usage in FastAPI endpoint:
        @router.get("/data")
        async def get_data(
            db: AsyncSession = Depends(auto_set_rls_from_request)
        ):
            # RLS variables are already set from JWT
            result = await db.execute(select(SpatialLayer))
            return result.scalars().all()
    """
    # Get values from request state (set by TenantContextMiddleware)
    tenant_id = getattr(request.state, 'tenant_id', None)
    user_id = getattr(request.state, 'user_id', None)
    user_role = getattr(request.state, 'user_role', None)

    # Set RLS variables if available
    if tenant_id or user_id or user_role:
        await set_rls_variables(
            session,
            tenant_id=tenant_id,
            user_id=user_id,
            user_role=user_role
        )

    return session
