import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_alert_missing_auth_vulnerability():
    """
    Test that the create_alert endpoint is now protected (returns 403) without an admin key.
    """
    with patch("app.dependencies.settings.ADMIN_API_KEY", "secret-admin-key"):
        payload = {
            "title": "Test Alert",
            "message": "This is a test alert",
            "alert_type": "traffic",
            "severity": "high",
            "location": {"lat": -33.92, "lng": 18.42},
            "radius_meters": 1000
        }

        # Request without the API key header
        response = client.post("/api/notifications/alerts/create", json=payload)

        # assert that it IS forbidden (fixed)
        assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"

def test_create_alert_with_valid_auth():
    """
    Test that the create_alert endpoint works with valid auth.
    """
    with patch("app.dependencies.settings.ADMIN_API_KEY", "secret-admin-key"):
        payload = {
            "title": "Test Alert",
            "message": "This is a test alert",
            "alert_type": "traffic",
            "severity": "high",
            "location": {"lat": -33.92, "lng": 18.42},
            "radius_meters": 1000
        }

        headers = {"X-Admin-API-Key": "secret-admin-key"}
        response = client.post("/api/notifications/alerts/create", json=payload, headers=headers)

        # Should be successful (200 OK)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        assert response.json()["success"] is True

def test_get_stats_missing_auth_vulnerability():
    """
    Test that the stats endpoint is now protected (returns 403) without an admin key.
    """
    with patch("app.dependencies.settings.ADMIN_API_KEY", "secret-admin-key"):
        response = client.get("/api/notifications/stats")
        assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"

def test_get_stats_with_valid_auth():
    """
    Test that the stats endpoint works with valid auth.
    """
    with patch("app.dependencies.settings.ADMIN_API_KEY", "secret-admin-key"):
        headers = {"X-Admin-API-Key": "secret-admin-key"}
        response = client.get("/api/notifications/stats", headers=headers)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
