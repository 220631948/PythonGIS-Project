import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Set environment variable before importing main
import os
os.environ["DATABASE_URL"] = "postgresql+asyncpg://user:pass@localhost/db"

from app.main import app

client = TestClient(app)

# We need to mock get_db to avoid DB connection issues
from app.core.database import get_db

async def override_get_db():
    yield MagicMock()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def mock_admin_key():
    """Ensure ADMIN_API_KEY is set so endpoints are actually protected during tests."""
    with patch("app.dependencies.settings.ADMIN_API_KEY", "test-secret-key"):
        yield

def test_cache_preload_unauthorized():
    """Test that /performance/cache/preload requires admin key."""
    payload = {
        "datasets": ["schools"],
        "zoom_levels": [10, 11]
    }

    # Request without header
    response = client.post("/api/performance/cache/preload", json=payload)
    assert response.status_code == 403
    assert "Invalid or missing admin API key" in response.json().get("detail", "")

    # Request with invalid header
    response = client.post(
        "/api/performance/cache/preload",
        json=payload,
        headers={"X-Admin-API-Key": "wrong-key"}
    )
    assert response.status_code == 403
    assert "Invalid or missing admin API key" in response.json().get("detail", "")

def test_cache_preload_authorized():
    """Test that /performance/cache/preload works with valid admin key."""
    payload = {
        "datasets": ["schools"],
        "zoom_levels": [10, 11]
    }

    response = client.post(
        "/api/performance/cache/preload",
        json=payload,
        headers={"X-Admin-API-Key": "test-secret-key"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

def test_cache_stats_unauthorized():
    """Test that /performance/cache/stats requires admin key."""
    # Request without header
    response = client.get("/api/performance/cache/stats")
    assert response.status_code == 403
    assert "Invalid or missing admin API key" in response.json().get("detail", "")

    # Request with invalid header
    response = client.get(
        "/api/performance/cache/stats",
        headers={"X-Admin-API-Key": "wrong-key"}
    )
    assert response.status_code == 403

def test_cache_stats_authorized():
    """Test that /performance/cache/stats works with valid admin key."""
    response = client.get(
        "/api/performance/cache/stats",
        headers={"X-Admin-API-Key": "test-secret-key"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "hit_rate" in data
