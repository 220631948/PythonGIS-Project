import os
import asyncio
from fastapi.testclient import TestClient

# Mock environment variables so initialization succeeds
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SENTRY_DSN"] = ""
os.environ["API_KEY"] = "test-key-123"
os.environ["ADMIN_API_KEY"] = "admin-secret-test-key"
os.environ["ENVIRONMENT"] = "testing"

# Mock the database engine creation and real APIs
from unittest.mock import patch
with patch("sqlalchemy.create_engine"), patch("sqlalchemy.ext.asyncio.create_async_engine"), \
     patch("app.api.metadata_api._refresh_cache"), patch("app.api.realtime_api._refresh_feed"):

    from app.main import app
    client = TestClient(app)

    print("\n--- Verifying Metadata Catalog Refresh Endpoint ---")

    # Test without auth
    resp1 = client.post("/api/catalog/refresh")
    print(f"Without Auth: {resp1.status_code}")
    assert resp1.status_code == 403, f"Expected 403 Forbidden, got {resp1.status_code}"

    # Test with auth
    resp2 = client.post("/api/catalog/refresh", headers={"X-Admin-API-Key": "admin-secret-test-key"})
    print(f"With Auth: {resp2.status_code}")
    assert resp2.status_code == 200, f"Expected 200 OK, got {resp2.status_code}: {resp2.text}"

    print("\n--- Verifying Realtime Feed Refresh Endpoint ---")

    # Test without auth
    resp3 = client.post("/api/realtime/feeds/traffic_status/refresh")
    print(f"Without Auth: {resp3.status_code}")
    assert resp3.status_code == 403, f"Expected 403 Forbidden, got {resp3.status_code}"

    # Test with auth (expected 404 because feed might not exist or be mocked, but not 403)
    # The realtime feed has a pre-check: `if feed_id not in _feed_configs: return 404`
    resp4 = client.post("/api/realtime/feeds/traffic_status/refresh", headers={"X-Admin-API-Key": "admin-secret-test-key"})
    print(f"With Auth: {resp4.status_code}")
    assert resp4.status_code in (200, 404), f"Expected 200 OK or 404 Not Found, got {resp4.status_code}: {resp4.text}"

    print("\n✅ Verification Successful!")
