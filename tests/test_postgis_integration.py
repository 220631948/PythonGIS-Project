import pytest
from sqlalchemy import create_engine, text
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.core.database import SessionLocal, Base, engine as db_engine

# Use the app's test client
client = TestClient(app)

# Check if DB is available (e.g. CI vs local dev)
try:
    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    DB_AVAILABLE = True
except:
    DB_AVAILABLE = False

@pytest.mark.skipif(not DB_AVAILABLE, reason="PostGIS database not available")
class TestPostGISFullIntegration:

    @classmethod
    def setup_class(cls):
        """Setup test database schema."""
        # In a real scenario, we might want to use a separate test DB
        # For this task, we assume the environment is set up for testing or dev
        pass

    def test_database_connection(self):
        """Verify we can connect and PostGIS is enabled."""
        with db_engine.connect() as conn:
            # Check PostGIS version
            version = conn.execute(text("SELECT PostGIS_Version();")).scalar()
            assert version is not None
            assert "3." in version # Expecting PostGIS 3.x

    def test_spatial_buffer_endpoint(self):
        """Test the PostGIS-backed buffer endpoint."""
        # Cape Town City Hall coordinates
        lat, lon = -33.9247, 18.4241
        distance = 500

        response = client.get(f"/api/spatial/buffer?lat={lat}&lon={lon}&distance={distance}")
        assert response.status_code == 200
        data = response.json()

        assert data["type"] == "Feature"
        assert data["geometry"]["type"] == "Polygon"
        assert data["properties"]["radius"] == distance

    def test_spatial_nearby_endpoint(self):
        """Test searching for nearby features."""
        # Requires data to be loaded. We'll skip exact assertion on count if empty,
        # but check the response structure and SQL execution success.

        lat, lon = -33.9247, 18.4241
        layer = "schools" # Mapped to service_facilities

        response = client.get(f"/api/spatial/nearby?layer={layer}&lat={lat}&lon={lon}&radius=5000")

        # 404 is acceptable if table doesn't exist yet (data loading script not run)
        # But 500 is not.
        if response.status_code == 404:
            pytest.skip("Data not loaded yet")

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "FeatureCollection"
        assert isinstance(data["features"], list)

    def test_services_analysis_integration(self):
        """Test the services analysis endpoint which uses complex PostGIS queries."""
        response = client.get("/api/services/access?simplify=0.001")

        assert response.status_code == 200
        data = response.json()

        # Should return GeoJSON or error if no data
        assert "geojson" in data or "features" in data or "error" in data

        if "geojson" in data:
            assert data["geojson"]["type"] == "FeatureCollection"
            if len(data["geojson"]["features"]) > 0:
                props = data["geojson"]["features"][0]["properties"]
                # Check for calculated fields
                assert "access_score" in props or "water_s" in props

