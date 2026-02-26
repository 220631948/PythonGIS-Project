import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point
from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_gdf():
    """Create a sample GeoDataFrame for testing."""
    df = pd.DataFrame({
        "id": [1, 2, 3],
        "name": ["Place A", "Place B", "Place C"],
        "category": ["A", "B", "A"]
    })
    gdf = gpd.GeoDataFrame(
        df,
        geometry=[Point(18.4, -33.9), Point(18.5, -33.8), Point(18.6, -33.7)],
        crs="EPSG:4326"
    )
    return gdf

def test_filter_dataset_optimization(mock_gdf):
    """Test that filter_dataset uses the optimized response format."""

    with patch("app.core.data_loader.data_loader.get_gdf", return_value=mock_gdf):
        response = client.post(
            "/api/filter/query",
            json={
                "dataset": "test_dataset",
                "conditions": [
                    {"field": "category", "operator": "eq", "value": "A"}
                ]
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Check metadata
        assert data["dataset"] == "test_dataset"
        assert data["original_count"] == 3
        assert data["filtered_count"] == 2
        assert data["filters_applied"] == 1

        # Check GeoJSON structure
        assert "geojson" in data
        assert data["geojson"]["type"] == "FeatureCollection"
        assert len(data["geojson"]["features"]) == 2

        # Check feature content
        features = data["geojson"]["features"]
        names = sorted([f["properties"]["name"] for f in features])
        assert names == ["Place A", "Place C"]

def test_text_search_optimization(mock_gdf):
    """Test that text_search uses the optimized response format."""

    with patch("app.core.data_loader.data_loader.get_gdf", return_value=mock_gdf):
        response = client.get(
            "/api/filter/search/test_dataset?q=Place B"
        )

        assert response.status_code == 200
        data = response.json()

        # Check metadata
        assert data["query"] == "Place B"
        assert data["count"] == 1

        # Check GeoJSON structure
        assert "geojson" in data
        assert len(data["geojson"]["features"]) == 1
        assert data["geojson"]["features"][0]["properties"]["name"] == "Place B"

def test_empty_result_optimization(mock_gdf):
    """Test optimization with empty result set."""

    with patch("app.core.data_loader.data_loader.get_gdf", return_value=mock_gdf):
        response = client.post(
            "/api/filter/query",
            json={
                "dataset": "test_dataset",
                "conditions": [
                    {"field": "category", "operator": "eq", "value": "Z"}
                ]
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["filtered_count"] == 0
        assert data["geojson"]["type"] == "FeatureCollection"
        assert len(data["geojson"]["features"]) == 0
