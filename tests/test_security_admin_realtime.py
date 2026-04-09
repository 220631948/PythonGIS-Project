import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@patch('app.api.realtime_api._refresh_feed')
@patch('app.dependencies.settings.ADMIN_API_KEY', 'test_key')
def test_realtime_refresh_auth(mock_refresh):
    response = client.post("/api/realtime/feeds/traffic_status/refresh")
    assert response.status_code in [401, 403]
    mock_refresh.assert_not_called()
