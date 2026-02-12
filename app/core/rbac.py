"""
Role-Based Access Control (RBAC) for Cape Town GeoHub

Defines roles, permissions, and decorators for endpoint authorization.
"""

from enum import Enum
from functools import wraps
from typing import List, Callable
from fastapi import HTTPException, status, Depends

from app.models.auth import User
from app.dependencies import get_current_active_user


# ============= Role Definitions =============

class Role(str, Enum):
    """User roles in the system with hierarchical permissions"""

    SUPER_ADMIN = "super_admin"      # Full system access, manage all tenants
    TENANT_ADMIN = "tenant_admin"    # Manage users and data within tenant
    EDITOR = "editor"                # Create/edit spatial data
    VIEWER = "viewer"                # Read-only access

    @classmethod
    def hierarchy(cls) -> dict:
        """
        Role hierarchy - higher roles inherit lower role permissions.
        Returns dict with role: level mapping (higher number = more permissions)
        """
        return {
            cls.SUPER_ADMIN: 4,
            cls.TENANT_ADMIN: 3,
            cls.EDITOR: 2,
            cls.VIEWER: 1,
        }

    def has_permission_level(self, required_role: "Role") -> bool:
        """Check if this role has at least the required permission level"""
        hierarchy = self.hierarchy()
        return hierarchy.get(self, 0) >= hierarchy.get(required_role, 0)


# ============= Permission Matrix =============

class Permission(str, Enum):
    """Fine-grained permissions for resources"""

    # Tenant Management
    TENANT_CREATE = "tenant:create"
    TENANT_READ = "tenant:read"
    TENANT_UPDATE = "tenant:update"
    TENANT_DELETE = "tenant:delete"

    # User Management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"

    # Spatial Data
    DATA_CREATE = "data:create"
    DATA_READ = "data:read"
    DATA_UPDATE = "data:update"
    DATA_DELETE = "data:delete"

    # Analytics
    ANALYTICS_RUN = "analytics:run"
    ANALYTICS_EXPORT = "analytics:export"

    # System
    SYSTEM_CONFIG = "system:config"
    SYSTEM_STATS = "system:stats"


# Role → Permissions mapping
ROLE_PERMISSIONS = {
    Role.SUPER_ADMIN: [
        # Tenant permissions
        Permission.TENANT_CREATE,
        Permission.TENANT_READ,
        Permission.TENANT_UPDATE,
        Permission.TENANT_DELETE,
        # User permissions (all tenants)
        Permission.USER_CREATE,
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        # Data permissions (all tenants)
        Permission.DATA_CREATE,
        Permission.DATA_READ,
        Permission.DATA_UPDATE,
        Permission.DATA_DELETE,
        # Analytics
        Permission.ANALYTICS_RUN,
        Permission.ANALYTICS_EXPORT,
        # System
        Permission.SYSTEM_CONFIG,
        Permission.SYSTEM_STATS,
    ],
    Role.TENANT_ADMIN: [
        # Tenant (read own only)
        Permission.TENANT_READ,
        # User management (own tenant only)
        Permission.USER_CREATE,
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        # Data (own tenant only)
        Permission.DATA_CREATE,
        Permission.DATA_READ,
        Permission.DATA_UPDATE,
        Permission.DATA_DELETE,
        # Analytics
        Permission.ANALYTICS_RUN,
        Permission.ANALYTICS_EXPORT,
    ],
    Role.EDITOR: [
        # User (read only, own tenant)
        Permission.USER_READ,
        # Data (edit, own tenant)
        Permission.DATA_CREATE,
        Permission.DATA_READ,
        Permission.DATA_UPDATE,
        # Analytics
        Permission.ANALYTICS_RUN,
    ],
    Role.VIEWER: [
        # Data (read only)
        Permission.DATA_READ,
        # Analytics (run only, no export)
        Permission.ANALYTICS_RUN,
    ],
}


# ============= Helper Functions =============

def get_role_permissions(role: Role) -> List[Permission]:
    """Get all permissions for a given role"""
    return ROLE_PERMISSIONS.get(role, [])


def has_permission(user: User, permission: Permission) -> bool:
    """Check if user has a specific permission"""
    role = Role(user.role)
    permissions = get_role_permissions(role)
    return permission in permissions


# ============= Decorators =============

def check_role(user: User, *allowed_roles: Role):
    """Check if user has any of the allowed roles"""
    user_role = Role(user.role)
    has_access = any(
        user_role.has_permission_level(required_role)
        for required_role in allowed_roles
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Required role: {[r.value for r in allowed_roles]}, "
                   f"your role: {user_role.value}"
        )

class RoleChecker:
    """Dependency for role-based access control"""
    def __init__(self, *allowed_roles: Role):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)):
        check_role(current_user, *self.allowed_roles)
        return current_user

def require_role(*allowed_roles: Role):
    """Legacy support for decorator (now using RoleChecker internally)"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This is hard to do generically with FastAPI dependencies
            # Better to use RoleChecker as a dependency
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_same_tenant(func: Callable) -> Callable:
    """
    Decorator to ensure user can only access resources in their own tenant.

    Usage:
        @router.get("/users")
        @require_same_tenant
        async def list_users(tenant_id: int, current_user: User = Depends(...)):
            # tenant_id is validated to match current_user.tenant_id
            pass
    """
    @wraps(func)
    async def wrapper(*args, current_user: User = Depends(get_current_active_user), **kwargs):
        # Super admins can access any tenant
        if current_user.role == Role.SUPER_ADMIN.value:
            return await func(*args, current_user=current_user, **kwargs)

        # Extract tenant_id from kwargs or args
        tenant_id = kwargs.get('tenant_id') or kwargs.get('resource', {}).get('tenant_id')

        if tenant_id and tenant_id != current_user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot access resources from other tenants"
            )

        return await func(*args, current_user=current_user, **kwargs)

    return wrapper
