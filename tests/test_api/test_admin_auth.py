import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.config import settings

client = TestClient(app)

@patch("app.api.metadata_api._refresh_cache")
def test_metadata_refresh_unauthorized(mock_refresh):
    settings.ADMIN_API_KEY = "expected_key"
    response = client.post(
        f"{settings.API_PREFIX}/catalog/refresh",
        headers={"X-Admin-API-Key": "invalid_key"}
    )
    assert response.status_code == 403
    assert "Invalid or missing admin API key" in response.json()["detail"]
    mock_refresh.assert_not_called()
    settings.ADMIN_API_KEY = ""

@patch("app.api.metadata_api._refresh_cache")
def test_metadata_refresh_authorized(mock_refresh):
    settings.ADMIN_API_KEY = "test_key"
    response = client.post(
        f"{settings.API_PREFIX}/catalog/refresh",
        headers={"X-Admin-API-Key": "test_key"}
    )
    assert response.status_code == 200
    mock_refresh.assert_called_once()
    settings.ADMIN_API_KEY = ""


@patch("app.api.realtime_api._refresh_feed")
def test_realtime_refresh_unauthorized(mock_refresh):
    settings.ADMIN_API_KEY = "expected_key"
    # Provide dummy config using monkeypatch or patch
    with patch("app.api.realtime_api._feed_configs", {"dummy_feed": {}}):
        response = client.post(
            f"{settings.API_PREFIX}/realtime/feeds/dummy_feed/refresh",
            headers={"X-Admin-API-Key": "invalid_key"}
        )
        assert response.status_code == 403
        assert "Invalid or missing admin API key" in response.json()["detail"]
        mock_refresh.assert_not_called()
    settings.ADMIN_API_KEY = ""

@patch("app.api.realtime_api._refresh_feed")
def test_realtime_refresh_authorized(mock_refresh):
    settings.ADMIN_API_KEY = "test_key"
    # Make the mocked async function return something properly without causing RecursionError in FastAPI.
    async def mock_async_refresh(*args, **kwargs):
        pass
    mock_refresh.side_effect = mock_async_refresh

    with patch("app.api.realtime_api._feed_configs", {"dummy_feed": {}}):
        response = client.post(
            f"{settings.API_PREFIX}/realtime/feeds/dummy_feed/refresh",
            headers={"X-Admin-API-Key": "test_key"}
        )
        assert response.status_code == 200
        mock_refresh.assert_called_once()

    settings.ADMIN_API_KEY = ""
