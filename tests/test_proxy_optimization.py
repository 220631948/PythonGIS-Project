
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
import geopandas as gpd
from shapely.geometry import Point

# Mock settings before importing app.main to avoid env var issues
with patch("app.config.settings") as mock_settings:
    mock_settings.DATA_URLS = {"test_dataset": "http://example.com/test.geojson"}
    mock_settings.CACHE_DURATION_DAYS = 1
    mock_settings.API_PREFIX = "/api"
    mock_settings.CORS_ORIGINS = ["*"]
    mock_settings.HOST = "localhost"
    mock_settings.PORT = 8000
    mock_settings.DEBUG = True

    # Also mock database connection check
    with patch("app.core.database.check_db_connection") as mock_db_check:
        mock_db_check.return_value = {"connected": True}

        from app.main import app

client = TestClient(app)

def test_proxy_data_optimization():
    # Create a dummy GeoDataFrame
    data = [{"id": 1, "name": "Point 1", "geometry": Point(0, 0)}]
    gdf = gpd.GeoDataFrame(data)

    # Mock data_loader.get_paginated_gdf
    with patch("app.core.data_loader.data_loader.get_paginated_gdf") as mock_get_paginated:
        mock_get_paginated.return_value = (gdf, 100)

        # Mock settings.DATA_URLS to include our test dataset
        with patch("app.config.settings.DATA_URLS", {"test_dataset": "http://example.com"}):

            response = client.get("/api/data/test_dataset?limit=10&offset=0&use_cache=false")

            assert response.status_code == 200
            data = response.json()

            assert data["type"] == "FeatureCollection"
            assert len(data["features"]) == 1
            assert data["features"][0]["properties"]["name"] == "Point 1"
            assert "metadata" in data
            assert data["metadata"]["total"] == 100
            assert data["metadata"]["limit"] == 10

            # Verify string splicing happened (implicit by successful parsing)
            # We can also check headers to see if X-Total-Count is set (part of the response logic)
            assert response.headers["X-Total-Count"] == "100"

if __name__ == "__main__":
    # If run directly
    pytest.main([__file__])
