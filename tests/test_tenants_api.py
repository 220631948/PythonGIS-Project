import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.auth import User, Tenant
from app.core.database import Base, get_db
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Use SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./test_tenants_api.db"
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

@pytest.fixture(autouse=True)
async def db_setup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, tables=[User.__table__, Tenant.__table__])
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all, tables=[User.__table__, Tenant.__table__])

@pytest.fixture(name="client")
def client_fixture():
    async def override_dependency():
        async with TestingSessionLocal() as session:
            yield session
    app.dependency_overrides[get_db] = override_dependency
    client = TestClient(app)
    # Get CSRF
    client.get("/api/auth/register")
    yield client
    app.dependency_overrides.clear()

@pytest.fixture
def super_admin_token(client):
    # Register super admin
    csrf_token = client.cookies.get("csrf_token")
    client.post(
        "/api/auth/register",
        json={"email": "admin@test.com", "password": "password", "role": "super_admin"},
        headers={"X-CSRF-Token": csrf_token} if csrf_token else {}
    )
    return create_access_token(subject="admin@test.com", claims={"role": "super_admin"})

@pytest.fixture
def viewer_token(client):
    # Register viewer
    csrf_token = client.cookies.get("csrf_token")
    client.post(
        "/api/auth/register",
        json={"email": "viewer@test.com", "password": "password", "role": "viewer"},
        headers={"X-CSRF-Token": csrf_token} if csrf_token else {}
    )
    return create_access_token(subject="viewer@test.com", claims={"role": "viewer"})

def test_list_tenants_super_admin(client, super_admin_token):
    response = client.get("/api/tenants", headers={"Authorization": f"Bearer {super_admin_token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_list_tenants_viewer_forbidden(client, viewer_token):
    response = client.get("/api/tenants", headers={"Authorization": f"Bearer {viewer_token}"})
    assert response.status_code == 403

def test_create_tenant_super_admin(client, super_admin_token):
    csrf_token = client.cookies.get("csrf_token")
    response = client.post(
        "/api/tenants",
        json={"name": "New Tenant", "slug": "new-tenant", "domain": "new.com"},
        headers={
            "Authorization": f"Bearer {super_admin_token}",
            "X-CSRF-Token": csrf_token
        } if csrf_token else {"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Tenant"
    assert "id" in data

def test_get_tenant_by_id(client, super_admin_token):
    csrf_token = client.cookies.get("csrf_token")
    # Create first
    create_res = client.post(
        "/api/tenants",
        json={"name": "Get Test", "slug": "get-test"},
        headers={
            "Authorization": f"Bearer {super_admin_token}",
            "X-CSRF-Token": csrf_token
        } if csrf_token else {"Authorization": f"Bearer {super_admin_token}"}
    )
    tenant_id = create_res.json()["id"]
    
    response = client.get(f"/api/tenants/{tenant_id}", headers={"Authorization": f"Bearer {super_admin_token}"})
    assert response.status_code == 200
    assert response.json()["name"] == "Get Test"

def test_get_tenant_not_found(client, super_admin_token):
    response = client.get("/api/tenants/999", headers={"Authorization": f"Bearer {super_admin_token}"})
    assert response.status_code == 404
