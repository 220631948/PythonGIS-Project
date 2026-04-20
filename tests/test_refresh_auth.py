from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

@patch('app.dependencies.settings.ADMIN_API_KEY', 'test_key')
def test_refresh_catalog_unauth():
    response = client.post("/api/catalog/refresh")
    assert response.status_code in [401, 403]

@patch('app.dependencies.settings.ADMIN_API_KEY', 'test_key')
def test_refresh_feed_unauth():
    response = client.post("/api/realtime/feeds/traffic_status/refresh")
    assert response.status_code in [401, 403]
