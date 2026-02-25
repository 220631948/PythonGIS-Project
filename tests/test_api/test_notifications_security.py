import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

def test_create_alert_requires_auth_when_key_set():
    """Test that create_alert endpoint requires auth when ADMIN_API_KEY is configured."""
    # Mock settings.ADMIN_API_KEY to be set
    with patch("app.dependencies.settings.ADMIN_API_KEY", "secret_key"):
        # Without header -> 403
        response = client.post("/api/notifications/alerts/create", json={
            "title": "Test Alert",
            "message": "Testing security",
            "alert_type": "safety",
            "severity": "medium",
            "location": {"lat": -33.925, "lng": 18.424},
            "radius_meters": 1000
        })
        assert response.status_code == 403

        # With wrong header -> 403
        response = client.post("/api/notifications/alerts/create", json={
            "title": "Test Alert",
            "message": "Testing security",
            "alert_type": "safety",
            "severity": "medium",
            "location": {"lat": -33.925, "lng": 18.424},
            "radius_meters": 1000
        }, headers={"X-Admin-API-Key": "wrong_key"})
        assert response.status_code == 403

        # With correct header -> 200
        response = client.post("/api/notifications/alerts/create", json={
            "title": "Test Alert",
            "message": "Testing security",
            "alert_type": "safety",
            "severity": "medium",
            "location": {"lat": -33.925, "lng": 18.424},
            "radius_meters": 1000
        }, headers={"X-Admin-API-Key": "secret_key"})
        assert response.status_code == 200

def test_stats_endpoint_requires_auth():
    """Test that stats endpoint requires auth when ADMIN_API_KEY is configured."""
    with patch("app.dependencies.settings.ADMIN_API_KEY", "secret_key"):
        response = client.get("/api/notifications/stats")
        assert response.status_code == 403

        response = client.get("/api/notifications/stats", headers={"X-Admin-API-Key": "secret_key"})
        assert response.status_code == 200
