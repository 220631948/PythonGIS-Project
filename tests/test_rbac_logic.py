import pytest
from app.core.rbac import Role, RoleChecker, check_role
from app.models.auth import User
from fastapi import HTTPException

def test_role_hierarchy():
    assert Role.SUPER_ADMIN.has_permission_level(Role.VIEWER)
    assert Role.TENANT_ADMIN.has_permission_level(Role.VIEWER)
    assert not Role.VIEWER.has_permission_level(Role.SUPER_ADMIN)

def test_check_role_success():
    user = User(role="super_admin")
    check_role(user, Role.SUPER_ADMIN)
    # No exception raised

def test_check_role_fail():
    user = User(role="viewer")
    with pytest.raises(HTTPException) as exc:
        check_role(user, Role.SUPER_ADMIN)
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_role_checker_call():
    checker = RoleChecker(Role.SUPER_ADMIN)
    user = User(role="super_admin", is_active=True)
    
    # Mock Depends behavior (checker is a callable that takes current_user)
    result = checker(current_user=user)
    assert result == user

@pytest.mark.asyncio
async def test_role_checker_fail():
    checker = RoleChecker(Role.SUPER_ADMIN)
    user = User(role="viewer", is_active=True)
    
    with pytest.raises(HTTPException):
        checker(current_user=user)
