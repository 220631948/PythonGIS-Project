import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
import geopandas as gpd
from shapely.geometry import Polygon, Point

# Mock result class for SQLAlchemy
class MockResult:
    def __init__(self, data):
        self._data = data

    def scalar(self):
        return self._data

    def fetchall(self):
        return [self._data] if self._data is not None else []

@pytest.fixture
def mock_db_session():
    mock_session = AsyncMock()
    # Default behavior: table exists check returns True
    mock_session.execute.return_value = MockResult(True)
    return mock_session

@pytest.fixture
def client(mock_db_session):
    async def override_get_db():
        yield mock_db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_point_in_polygon_optimized(client, mock_db_session):
    """
    Test that point_in_polygon uses DB optimization when table exists.
    """
    # Setup
    layer_name = "schools"
    polygon = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
    }

    # Mock DB responses
    # First call checks table existence (returns row with table name)
    # Second call executes the count query (5)
    # The first result mimics a single row result from fetchall: [('schools',)]
    mock_db_session.execute.side_effect = [
        MockResult(('schools',)),  # Table exists
        MockResult(5)              # Count result
    ]

    # We patch the instance method on the class to ensure it catches calls on the singleton instance
    with patch("app.core.data_loader.DataLoader.get_gdf") as mock_get_gdf:
        response = client.post("/api/spatial/point-in-polygon", json={
            "polygon": polygon,
            "layers": [layer_name]
        })

        assert response.status_code == 200
        data = response.json()
        assert data["counts"][layer_name] == 5

        # Verify get_gdf was NOT called (optimization used)
        mock_get_gdf.assert_not_called()

        # Verify DB calls
        # Note: Depending on implementation details, call count might vary if other DB calls happen
        # But we expect at least check + query
        assert mock_db_session.execute.call_count >= 2

        # Verify query structure
        calls = mock_db_session.execute.call_args_list
        exists_query = str(calls[0][0][0])
        count_query = str(calls[1][0][0])

        assert "information_schema.tables" in exists_query
        # The query should use ST_Within or ST_Intersects and reference the table
        assert "ST_Within" in count_query or "ST_Intersects" in count_query
        assert layer_name in count_query

def test_point_in_polygon_fallback(client, mock_db_session):
    """
    Test that point_in_polygon falls back to data_loader when table does not exist.
    """
    # Setup
    layer_name = "missing_table"
    polygon = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
    }

    # Mock DB responses
    # Table existence check returns empty result (None -> [])
    mock_db_session.execute.side_effect = [
        MockResult(None)
    ]

    # Mock data_loader.get_gdf to return a dummy GDF with a point inside the polygon
    # The polygon is (0,0) to (10,10). Point (1,1) is inside.
    dummy_gdf = gpd.GeoDataFrame(
        {'geometry': [Point(1, 1)]},
        crs="EPSG:4326"
    )

    with patch("app.core.data_loader.DataLoader.get_gdf", return_value=dummy_gdf) as mock_get_gdf:
        response = client.post("/api/spatial/point-in-polygon", json={
            "polygon": polygon,
            "layers": [layer_name]
        })

        assert response.status_code == 200
        data = response.json()

        # Since dummy point is within request polygon, count should be 1
        assert data["counts"][layer_name] == 1

        # Verify get_gdf WAS called (fallback used)
        mock_get_gdf.assert_called_once_with(layer_name)
