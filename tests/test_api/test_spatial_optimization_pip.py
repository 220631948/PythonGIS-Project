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

    def scalars(self):
        return self

    def all(self):
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
    # First call checks table existence (returns list of existing tables)
    # Second call executes the count query (5)
    mock_db_session.execute.side_effect = [
        MockResult([layer_name]),  # Table exists
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
    # Table existence check returns empty list
    mock_db_session.execute.side_effect = [
        MockResult([])
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

def test_point_in_polygon_batch_optimization(client, mock_db_session):
    """
    Test that point_in_polygon uses a single query to check existence of multiple tables.
    """
    # Setup
    layers = ["layer1", "layer2", "layer3"]
    polygon = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
    }

    # Mock DB responses
    # 1. Batch check -> returns ['layer1', 'layer3']
    # 2. Count for layer1 -> returns 10
    # 3. Count for layer3 -> returns 30

    # We use side_effect to return different MockResults for consecutive execute calls
    mock_db_session.execute.side_effect = [
        MockResult(["layer1", "layer3"]), # Batch check result
        MockResult(10), # Count for layer1
        MockResult(30)  # Count for layer3
    ]

    # Mock data_loader for layer2 (fallback)
    # We patch the instance method on the class to ensure it catches calls on the singleton instance
    with patch("app.core.data_loader.DataLoader.get_gdf") as mock_get_gdf:
        # Create a mock GDF with 1 point inside
        mock_get_gdf.return_value = gpd.GeoDataFrame(
            {'geometry': [Point(5, 5)]},
            crs="EPSG:4326"
        )

        response = client.post("/api/spatial/point-in-polygon", json={
            "polygon": polygon,
            "layers": layers
        })

        assert response.status_code == 200
        data = response.json()

        # Verify counts
        assert data["counts"]["layer1"] == 10
        assert data["counts"]["layer2"] == 1 # From fallback
        assert data["counts"]["layer3"] == 30

        # Verify DB calls
        # We expect exactly 3 DB calls if optimization works.
        assert mock_db_session.execute.call_count == 3

        calls = mock_db_session.execute.call_args_list
        batch_query = str(calls[0][0][0])

        # Check that the first query is indeed the batch query
        assert "information_schema.tables" in batch_query
        assert "ANY" in batch_query
