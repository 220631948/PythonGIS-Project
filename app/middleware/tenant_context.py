"""
Tenant Context Middleware for Multi-Tenant Isolation

Sets PostgreSQL session variable for Row-Level Security (RLS) enforcement.
"""

import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from jose import jwt, JWTError

from app.config import settings
from app.core.security import SECRET_KEY, ALGORITHM

logger = logging.getLogger(__name__)


class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract tenant_id from JWT and set PostgreSQL session variable.

    This enables Row-Level Security (RLS) policies to automatically filter data
    by tenant without modifying application queries.

    Flow:
        1. Extract JWT from Authorization header
        2. Decode token and get tenant_id
        3. Set PostgreSQL session variable: SET LOCAL app.current_tenant_id = X
        4. All subsequent queries automatically filter by tenant (via RLS policies)
    """

    async def dispatch(self, request: Request, call_next):
        """
        Process request and inject tenant context.
        """
        # Skip tenant context for public endpoints
        public_paths = [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/auth/login",
            "/api/auth/register",
        ]

        if any(request.url.path.startswith(path) for path in public_paths):
            return await call_next(request)

        # Extract tenant_id from JWT
        tenant_id = None
        authorization = request.headers.get("Authorization")

        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                tenant_id = payload.get("tenant_id")
                user_id = payload.get("user_id")
                role = payload.get("role")

                # Add to request state for easy access in endpoints
                request.state.tenant_id = tenant_id
                request.state.user_id = user_id
                request.state.user_role = role

                logger.debug(
                    f"Tenant context: tenant_id={tenant_id}, user_id={user_id}, role={role}"
                )

            except JWTError as e:
                logger.warning(f"Failed to decode JWT for tenant context: {e}")
                # Don't fail request - let auth dependency handle invalid tokens

        # Set PostgreSQL session variable for RLS
        if tenant_id:
            # Note: This requires database session to be available
            # The actual RLS enforcement happens in database queries
            # For now, we just set request state - full RLS implementation
            # requires SQLAlchemy session event listeners
            request.state.tenant_id = tenant_id
            logger.debug(f"Set tenant context: tenant_id={tenant_id}")

        # Process request
        response = await call_next(request)

        return response


# TODO: Implement SQLAlchemy event listener to set PostgreSQL session variable
# Example implementation:
#
# from sqlalchemy import event
# from sqlalchemy.engine import Engine
#
# @event.listens_for(Engine, "connect")
# def set_tenant_id(dbapi_conn, connection_record):
#     """Set tenant_id session variable on database connection"""
#     tenant_id = get_current_tenant_id()  # From request context
#     if tenant_id:
#         cursor = dbapi_conn.cursor()
#         cursor.execute(f"SET LOCAL app.current_tenant_id = {tenant_id}")
#         cursor.close()
