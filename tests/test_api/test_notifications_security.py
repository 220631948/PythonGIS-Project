
import pytest
from httpx import AsyncClient
from app.main import app
from app.config import settings
import os

@pytest.mark.anyio
async def test_create_alert_security():
    """
    Test that creating an alert requires admin authentication.
    """
    # Set a secret key
    original_key = settings.ADMIN_API_KEY
    settings.ADMIN_API_KEY = "test-secret-key"

    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            payload = {
                "title": "Security Test Alert",
                "message": "This should not be allowed",
                "alert_type": "security",
                "severity": "high",
                "location": {"lat": -33.92, "lng": 18.42},
                "radius_meters": 1000
            }

            # 1. Test without header -> Should fail (403)
            response = await client.post("/api/notifications/alerts/create", json=payload)
            assert response.status_code == 403, "Endpoint should be protected"

            # 2. Test with wrong header -> Should fail (403)
            response = await client.post(
                "/api/notifications/alerts/create",
                json=payload,
                headers={"X-Admin-API-Key": "wrong-key"}
            )
            assert response.status_code == 403, "Endpoint should reject invalid key"

            # 3. Test with correct header -> Should succeed (200)
            # Note: create_alert returns 200 on success
            response = await client.post(
                "/api/notifications/alerts/create",
                json=payload,
                headers={"X-Admin-API-Key": "test-secret-key"}
            )
            assert response.status_code == 200, "Endpoint should accept valid key"

    finally:
        # Restore settings
        settings.ADMIN_API_KEY = original_key

@pytest.mark.anyio
async def test_stats_security():
    """
    Test that getting notification stats requires admin authentication.
    """
    # Set a secret key
    original_key = settings.ADMIN_API_KEY
    settings.ADMIN_API_KEY = "test-secret-key"

    try:
        async with AsyncClient(app=app, base_url="http://test") as client:

            # 1. Test without header -> Should fail (403)
            response = await client.get("/api/notifications/stats")
            assert response.status_code == 403, "Stats endpoint should be protected"

            # 2. Test with wrong header -> Should fail (403)
            response = await client.get(
                "/api/notifications/stats",
                headers={"X-Admin-API-Key": "wrong-key"}
            )
            assert response.status_code == 403, "Stats endpoint should reject invalid key"

            # 3. Test with correct header -> Should succeed (200)
            response = await client.get(
                "/api/notifications/stats",
                headers={"X-Admin-API-Key": "test-secret-key"}
            )
            assert response.status_code == 200, "Stats endpoint should accept valid key"

    finally:
        # Restore settings
        settings.ADMIN_API_KEY = original_key
