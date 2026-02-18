from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db

# Mock result class to simulate SQLAlchemy Result
class MockResult:
    def __init__(self, data):
        self._data = data

    def scalar(self):
        return self._data

    def fetchall(self):
        return self._data

    def __iter__(self):
        return iter(self._data)

@pytest.fixture
def mock_db_session():
    mock_session = AsyncMock()
    # Mock execute to return a MockResult
    mock_session.execute.return_value = MockResult(None)
    return mock_session

@pytest.fixture
def client(mock_db_session):
    async def override_get_db():
        yield mock_db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_nearby_features_optimization(client, mock_db_session):
    """
    Test that get_nearby_features uses optimized JSON build SQL query.
    """
    # Setup mock return value for the optimized query
    expected_geojson = '{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [18.42, -33.92]}, "properties": {"id": 1, "name": "Test Place"}}]}'
    mock_db_session.execute.return_value = MockResult(expected_geojson)

    response = client.get("/api/spatial/nearby?layer=schools&lat=-33.92&lon=18.42&radius=500")

    # Verify response
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert response.text == expected_geojson

    # Verify SQL query structure
    call_args = mock_db_session.execute.call_args
    assert call_args is not None
    query = str(call_args[0][0])

    # Check for key optimization functions
    assert "json_build_object" in query.lower()
    assert "json_agg" in query.lower()
    assert "st_asgeojson" in query.lower()
