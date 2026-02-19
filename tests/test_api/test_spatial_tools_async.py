import pytest
import json
from unittest.mock import MagicMock, AsyncMock, ANY
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.core.database import get_db

@pytest.fixture
def mock_session():
    return AsyncMock(spec=AsyncSession)

@pytest.fixture
def client(mock_session):
    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides = {}

def test_nearby_returns_valid_json(client, mock_session):
    # Setup the mock return value for the optimized query
    # The optimized query returns a single scalar string
    expected_json = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [18.42, -33.92]},
                "properties": {"id": 1, "name": "Test School", "distance_meters": 100}
            }
        ],
        "count": 1
    }

    # Mock the execute result
    mock_result = MagicMock()
    mock_result.scalar.return_value = json.dumps(expected_json)
    mock_session.execute.return_value = mock_result

    response = client.get("/api/spatial/nearby?layer=schools&lat=-33.92&lon=18.42")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 1

    # Verify db.execute was called
    mock_session.execute.assert_called_once()

    # Verify the SQL query contained json_build_object
    call_args = mock_session.execute.call_args
    sql_text = str(call_args[0][0])
    assert "json_build_object" in sql_text.lower()


def test_nearby_empty_result_returns_valid_json(client, mock_session):
    # Setup the mock return value for the optimized query with an empty result set
    expected_json = {
        "type": "FeatureCollection",
        "features": [],
        "count": 0,
    }

    # Mock the execute result
    mock_result = MagicMock()
    mock_result.scalar.return_value = json.dumps(expected_json)
    mock_session.execute.return_value = mock_result

    response = client.get("/api/spatial/nearby?layer=schools&lat=-33.92&lon=18.42")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 0
    assert data["count"] == 0

    # Verify db.execute was called
    mock_session.execute.assert_called_once()

    # Verify the SQL query contained json_build_object
    call_args = mock_session.execute.call_args
    sql_text = str(call_args[0][0])
    assert "json_build_object" in sql_text.lower()
def test_buffer_returns_valid_json(client, mock_session):
    # Setup the mock return value for the buffer query
    expected_geom = {
        "type": "Polygon",
        "coordinates": [[[18.4, -33.9], [18.5, -33.9], [18.5, -34.0], [18.4, -34.0], [18.4, -33.9]]]
    }

    # Mock the execute result
    mock_result = MagicMock()
    mock_result.scalar.return_value = json.dumps(expected_geom)
    mock_session.execute.return_value = mock_result

    response = client.get("/api/spatial/buffer?lat=-33.92&lon=18.42&distance=500")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

    data = response.json()
    assert data["type"] == "Feature"
    assert data["geometry"]["type"] == "Polygon"
    assert data["properties"]["radius"] == 500

    # Verify db.execute was called
    mock_session.execute.assert_called_once()

    # Verify the SQL query contained ST_Buffer
    call_args = mock_session.execute.call_args
    sql_text = str(call_args[0][0])
    assert "st_buffer" in sql_text.lower()
