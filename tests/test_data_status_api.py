import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def simple_client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.anyio
async def test_check_all_sources_health_async(simple_client):
    # Mock return value for check_all_sources_health_async
    mock_results = {
        "dataset1": {"status": "ok", "accessible": True},
        "dataset2": {"status": "error", "accessible": False}
    }

    with patch("app.core.data_loader.data_loader.check_all_sources_health_async", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_results

        response = await simple_client.get("/api/data-status/health")

        assert response.status_code == 200
        data = response.json()

        assert data["summary"]["total_sources"] == 2
        assert data["summary"]["accessible"] == 1
        assert data["sources"] == mock_results
        mock_check.assert_called_once()

@pytest.mark.anyio
async def test_check_source_health_async(simple_client):
    mock_result = {"status": "ok", "accessible": True}

    with patch("app.core.data_loader.data_loader.check_data_source_health_async", new_callable=AsyncMock) as mock_check:
        mock_check.return_value = mock_result

        response = await simple_client.get("/api/data-status/health/dataset1")

        assert response.status_code == 200
        assert response.json() == mock_result
        mock_check.assert_called_once_with("dataset1")
