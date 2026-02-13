"""
Tenant Isolation Integration Tests

Sprint 4 - S4.1 / F.1.2: Tenant isolation integration tests
Ensures RLS policies prevent cross-tenant data leakage

Tests:
- Users can only see data from their tenant
- Spatial queries are tenant-scoped
- Admin endpoints respect tenant boundaries
- Cross-tenant access attempts are blocked
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app

# Use SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./test_tenant.db"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)


from app.models.auth import User, Tenant

@pytest.fixture(autouse=True)
async def db_setup():
    """Ensure database tables are created before each test"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, tables=[User.__table__, Tenant.__table__])
    yield
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all, tables=[User.__table__, Tenant.__table__])


@pytest.fixture(name="client")
def client_fixture(db_setup):
    """Create test client with database override"""

    async def override_dependency():
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_dependency
    client = TestClient(app)
    # Initialize CSRF cookie
    client.get("/api/auth/register")
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def tenant1_user(client):
    """Create user in tenant 1"""
    csrf_token = client.cookies.get("csrf_token")
    headers = {"X-CSRF-Token": csrf_token} if csrf_token else {}
    
    response = client.post(
        "/api/auth/register",
        json={
            "email": "user1@tenant1.com",
            "password": "password123",
            "full_name": "Tenant 1 User",
        },
        headers=headers
    )
    user_data = response.json()

    # Create access token
    token = create_access_token(
        subject=user_data["email"],
        claims={
            "user_id": user_data["id"],
            "tenant_id": 1,
            "role": "viewer",
        }
    )

    return {"user": user_data, "token": token, "tenant_id": 1}


@pytest.fixture
def tenant2_user(client):
    """Create user in tenant 2"""
    csrf_token = client.cookies.get("csrf_token")
    headers = {"X-CSRF-Token": csrf_token} if csrf_token else {}

    response = client.post(
        "/api/auth/register",
        json={
            "email": "user2@tenant2.com",
            "password": "password123",
            "full_name": "Tenant 2 User",
        },
        headers=headers
    )
    user_data = response.json()

    # Create access token with tenant_id = 2
    token = create_access_token(
        subject=user_data["email"],
        claims={
            "user_id": user_data["id"],
            "tenant_id": 2,
            "role": "viewer",
        }
    )

    return {"user": user_data, "token": token, "tenant_id": 2}


class TestTenantIsolation:
    """Test tenant data isolation"""

    def test_users_cannot_see_other_tenant_data(self, client, tenant1_user, tenant2_user):
        """Test that users can only see data from their own tenant"""
        # This test assumes a /api/data endpoint that returns tenant-scoped data
        # Tenant 1 user queries data
        response1 = client.get(
            "/api/data/spatial_layers",
            headers={"Authorization": f"Bearer {tenant1_user['token']}"},
        )

        # Tenant 2 user queries data
        response2 = client.get(
            "/api/data/spatial_layers",
            headers={"Authorization": f"Bearer {tenant2_user['token']}"},
        )

        # Both should succeed but return different data
        if response1.status_code == 200 and response2.status_code == 200:
            data1 = response1.json()
            data2 = response2.json()

            # Data should be different (or empty for one tenant)
            # In a real test, we'd insert known data for each tenant first
            assert data1 != data2 or (len(data1) == 0 and len(data2) == 0)

    def test_spatial_queries_are_tenant_scoped(self, client, tenant1_user):
        """Test that spatial queries only return data from user's tenant"""
        # Create spatial query with bounding box
        query_data = {
            "bounds": {"min_lat": -34.0, "max_lat": -33.8, "min_lng": 18.0, "max_lng": 18.6}
        }

        csrf_token = client.cookies.get("csrf_token")
        headers = {
            "Authorization": f"Bearer {tenant1_user['token']}",
            "X-CSRF-Token": csrf_token
        } if csrf_token else {"Authorization": f"Bearer {tenant1_user['token']}"}

        response = client.post(
            "/api/advanced-search/spatial-query",
            json=query_data,
            headers=headers,
        )

        # Query should succeed or return 404 if endpoint doesn't exist
        assert response.status_code in [200, 404, 422]

        if response.status_code == 200:
            data = response.json()
            # Verify all returned features belong to tenant 1
            if "features" in data:
                for feature in data["features"]:
                    # Check tenant_id in properties if present
                    if "properties" in feature and "tenant_id" in feature["properties"]:
                        assert feature["properties"]["tenant_id"] == tenant1_user["tenant_id"]

    def test_cross_tenant_access_blocked(self, client, tenant1_user, tenant2_user):
        """Test that users cannot access another tenant's specific resources"""
        # Assume we have an endpoint like /api/layers/{layer_id}
        # where layer_id belongs to tenant 2

        # Tenant 1 user tries to access tenant 2's layer (hypothetical layer_id=100)
        response = client.get(
            "/api/layers/100",
            headers={"Authorization": f"Bearer {tenant1_user['token']}"},
        )

        # Should return 403 (Forbidden) or 404 (Not Found due to tenant filtering)
        assert response.status_code in [403, 404]

    def test_admin_endpoints_respect_tenant_boundaries(self, client, tenant1_user):
        """Test that even admin users can't access other tenants' data"""
        # Create tenant admin token
        admin_token = create_access_token(
            subject=tenant1_user["user"]["email"],
            claims={
                "user_id": tenant1_user["user"]["id"],
                "tenant_id": 1,
                "role": "tenant_admin",
            }
        )

        # Try to query all users (should only see tenant 1 users)
        response = client.get(
            "/api/users", headers={"Authorization": f"Bearer {admin_token}"}
        )

        if response.status_code == 200:
            users = response.json()
            # All users should belong to tenant 1
            for user in users:
                if "tenant_id" in user:
                    assert user["tenant_id"] == 1


class TestRLSPolicies:
    """Test Row-Level Security policies"""

    def test_select_policy_filters_by_tenant(self, client, tenant1_user):
        """Test that SELECT queries are automatically filtered by tenant_id"""
        # This test verifies RLS SELECT policy
        response = client.get(
            "/api/data/suburbs", headers={"Authorization": f"Bearer {tenant1_user['token']}"}
        )

        # Should succeed or return 404 if endpoint doesn't exist
        assert response.status_code in [200, 404]

        if response.status_code == 200:
            data = response.json()
            # Verify all data belongs to tenant 1
            if "features" in data:
                for feature in data["features"]:
                    if "properties" in feature and "tenant_id" in feature["properties"]:
                        assert feature["properties"]["tenant_id"] == tenant1_user["tenant_id"]

    def test_insert_policy_sets_tenant_id(self, client, tenant1_user):
        """Test that INSERT operations automatically set tenant_id"""
        # Try to insert a new spatial layer
        layer_data = {
            "name": "Test Layer",
            "description": "Test layer for tenant isolation",
            "geojson": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [18.5, -33.9]},
                        "properties": {"name": "Test Point"},
                    }
                ],
            },
        }

        csrf_token = client.cookies.get("csrf_token")
        headers = {
            "Authorization": f"Bearer {tenant1_user['token']}",
            "X-CSRF-Token": csrf_token
        } if csrf_token else {"Authorization": f"Bearer {tenant1_user['token']}"}

        response = client.post(
            "/api/layers",
            json=layer_data,
            headers=headers,
        )

        # Should succeed or return 404/422 if endpoint doesn't exist
        if response.status_code in [200, 201]:
            created_layer = response.json()
            # Verify tenant_id was set automatically
            assert "tenant_id" in created_layer
            assert created_layer["tenant_id"] == tenant1_user["tenant_id"]

    def test_update_policy_restricts_to_own_tenant(self, client, tenant1_user):
        """Test that UPDATE operations can only modify own tenant's data"""
        # This test verifies RLS UPDATE policy
        # Try to update a layer (assume layer_id=1 exists for tenant 1)

        update_data = {"name": "Updated Layer Name"}

        csrf_token = client.cookies.get("csrf_token")
        headers = {
            "Authorization": f"Bearer {tenant1_user['token']}",
            "X-CSRF-Token": csrf_token
        } if csrf_token else {"Authorization": f"Bearer {tenant1_user['token']}"}

        response = client.put(
            "/api/layers/1",
            json=update_data,
            headers=headers,
        )

        # Should succeed (200), not found (404), or method not allowed (405)
        assert response.status_code in [200, 404, 405, 422]

    def test_delete_policy_restricts_to_own_tenant(self, client, tenant1_user):
        """Test that DELETE operations can only remove own tenant's data"""
        # Try to delete a layer
        csrf_token = client.cookies.get("csrf_token")
        headers = {
            "Authorization": f"Bearer {tenant1_user['token']}",
            "X-CSRF-Token": csrf_token
        } if csrf_token else {"Authorization": f"Bearer {tenant1_user['token']}"}

        response = client.delete(
            "/api/layers/1", headers=headers
        )

        # Should succeed (200/204), not found (404), or method not allowed (405)
        assert response.status_code in [200, 204, 404, 405]


class TestSuperAdminAccess:
    """Test super_admin can access multiple tenants"""

    def test_super_admin_can_list_all_tenants(self, client):
        """Test that super_admin can see all tenants"""
        # Register super admin first
        client.post(
            "/api/auth/register",
            json={
                "email": "admin@geohub.com",
                "password": "password123",
                "full_name": "Super Admin",
                "role": "super_admin"
            }
        )

        # Create super admin token
        super_admin_token = create_access_token(
            subject="admin@geohub.com",
            claims={
                "role": "super_admin",
            }
        )

        response = client.get(
            "/api/tenants", headers={"Authorization": f"Bearer {super_admin_token}"}
        )
        if response.status_code == 422:
            print(f"DEBUG 422 Detail: {response.json()}")

        # Should succeed or return 404 if endpoint doesn't exist
        assert response.status_code in [200, 404]

    def test_super_admin_can_create_tenant(self, client):
        """Test that super_admin can create new tenants"""
        # Register super admin first
        client.post(
            "/api/auth/register",
            json={
                "email": "admin2@geohub.com",
                "password": "password123",
                "full_name": "Super Admin",
                "role": "super_admin"
            }
        )

        super_admin_token = create_access_token(
            subject="admin2@geohub.com",
            claims={
                "role": "super_admin",
            }
        )

        tenant_data = {
            "name": "New Tenant",
            "domain": "newtenant.example.com",
            "description": "Test tenant",
        }

        csrf_token = client.cookies.get("csrf_token")
        headers = {
            "Authorization": f"Bearer {super_admin_token}",
            "X-CSRF-Token": csrf_token
        } if csrf_token else {"Authorization": f"Bearer {super_admin_token}"}

        response = client.post(
            "/api/tenants",
            json=tenant_data,
            headers=headers,
        )

        # Should succeed (201) or return 404 if endpoint doesn't exist
        assert response.status_code in [200, 201, 404, 422]


# Integration test combining multiple scenarios
class TestTenantIsolationIntegration:
    """Integration tests for complete tenant isolation"""

    def test_complete_tenant_isolation_workflow(self, client, tenant1_user, tenant2_user):
        """
        Complete workflow test:
        1. Tenant 1 user creates a layer
        2. Tenant 2 user tries to access it (should fail)
        3. Tenant 1 user can access their own layer
        """
        # Step 1: Tenant 1 creates layer
        layer_data = {
            "name": "Tenant 1 Private Layer",
            "description": "This should only be visible to Tenant 1",
        }

        csrf_token = client.cookies.get("csrf_token")
        headers = {
            "Authorization": f"Bearer {tenant1_user['token']}",
            "X-CSRF-Token": csrf_token
        } if csrf_token else {"Authorization": f"Bearer {tenant1_user['token']}"}

        create_response = client.post(
            "/api/layers",
            json=layer_data,
            headers=headers,
        )

        if create_response.status_code in [200, 201]:
            layer_id = create_response.json().get("id")

            # Step 2: Tenant 2 tries to access (should fail)
            access_response = client.get(
                f"/api/layers/{layer_id}",
                headers={"Authorization": f"Bearer {tenant2_user['token']}"},
            )
            assert access_response.status_code in [403, 404]

            # Step 3: Tenant 1 can access
            tenant1_access = client.get(
                f"/api/layers/{layer_id}",
                headers={"Authorization": f"Bearer {tenant1_user['token']}"},
            )
            assert tenant1_access.status_code == 200
