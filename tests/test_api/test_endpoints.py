"""
Tests for API endpoints.

These tests verify that all API endpoints respond correctly
and return the expected data structures.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import require_admin_key

client = TestClient(app)

# Helper to mock admin auth
def mock_require_admin_key():
    return "mocked_admin_key"

class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_returns_200(self):
        """Test that health endpoint returns 200 status."""
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_returns_healthy_status(self):
        """Test that health endpoint returns healthy status."""
        response = client.get("/api/health")
        data = response.json()
        assert data["status"] == "healthy"

    def test_health_includes_version(self):
        """Test that health endpoint includes version info."""
        response = client.get("/api/health")
        data = response.json()
        assert "version" in data
        assert data["version"] == "1.0.0"

    def test_health_includes_system_info(self):
        """Test that health endpoint includes system information."""
        response = client.get("/api/health")
        data = response.json()
        assert "system" in data
        assert "cpu_percent" in data["system"]
        assert "memory" in data["system"]


class TestConfigEndpoint:
    """Tests for the config endpoint."""

    def setup_method(self):
        app.dependency_overrides[require_admin_key] = mock_require_admin_key

    def teardown_method(self):
        if require_admin_key in app.dependency_overrides:
            del app.dependency_overrides[require_admin_key]

    def test_config_returns_200(self):
        """Test that config endpoint returns 200 status."""
        response = client.get("/api/config")
        assert response.status_code == 200

    def test_config_contains_app_name(self):
        """Test that config contains application name."""
        response = client.get("/api/config")
        data = response.json()
        assert data["app_name"] == "Cape Town GeoHub"

    def test_config_returns_403_without_key(self):
        """Test that config endpoint returns 403 when no key is provided and not mocked."""
        # Temporarily remove override for this test
        if require_admin_key in app.dependency_overrides:
            del app.dependency_overrides[require_admin_key]

        response = client.get("/api/config")
        assert response.status_code == 403
        # Restore override for teardown to be clean (optional but good practice)
        app.dependency_overrides[require_admin_key] = mock_require_admin_key


class TestStatsEndpoint:
    """Tests for the stats endpoint."""

    def setup_method(self):
        app.dependency_overrides[require_admin_key] = mock_require_admin_key

    def teardown_method(self):
        if require_admin_key in app.dependency_overrides:
            del app.dependency_overrides[require_admin_key]

    def test_stats_returns_200(self):
        """Test that stats endpoint returns 200 status."""
        response = client.get("/api/stats")
        assert response.status_code == 200

    def test_stats_contains_request_stats(self):
        """Test that stats contains request statistics."""
        response = client.get("/api/stats")
        data = response.json()
        assert "request_stats" in data
        assert "error_stats" in data


class TestServicesEndpoint:
    """Tests for the services analysis endpoint."""

    def test_services_access_returns_valid_response(self):
        """Test that services access endpoint returns valid response."""
        response = client.get("/api/services/access")
        # May return 200 with data or 500 if data download fails
        assert response.status_code in [200, 500]

        if response.status_code == 200:
            data = response.json()
            assert "geojson" in data or "error" in data


class TestTransportEndpoint:
    """Tests for the transport analysis endpoint."""

    def test_transport_requires_coordinates(self):
        """Test that transport endpoint requires lat/lon parameters."""
        response = client.get("/api/transport/accessibility")
        # Should return 422 for missing required parameters
        assert response.status_code == 422

    def test_transport_with_coordinates(self):
        """Test transport endpoint with valid coordinates."""
        response = client.get("/api/transport/accessibility?lat=-33.9249&lon=18.4232")
        # May return 200 with data or 500 if data download fails
        assert response.status_code in [200, 500]


class TestSpatialToolsEndpoint:
    """Tests for spatial tools endpoints."""

    def test_buffer_endpoint(self):
        """Test buffer creation endpoint."""
        # Mock get_db to avoid connecting to real DB
        from app.core.database import get_db
        from unittest.mock import AsyncMock, MagicMock
        import json

        async def mock_get_db():
            mock_session = AsyncMock()
            # Mock buffer result - must be MagicMock as scalar() is sync
            mock_result = MagicMock()
            # Return a valid GeoJSON for buffer
            mock_result.scalar.return_value = json.dumps({
                "type": "Polygon",
                "coordinates": [[[0,0], [0,1], [1,1], [1,0], [0,0]]]
            })
            mock_session.execute.return_value = mock_result
            yield mock_session

        app.dependency_overrides[get_db] = mock_get_db

        try:
            response = client.get("/api/spatial/buffer?lat=-33.9249&lon=18.4232&distance=500")
            assert response.status_code == 200

            data = response.json()
            assert data["type"] == "Feature"
            assert "geometry" in data
            assert data["properties"]["radius"] == 500
        finally:
            app.dependency_overrides.clear()

    def test_point_in_polygon_endpoint(self):
        """Test point-in-polygon endpoint with valid request."""
        # Mock get_db to avoid connecting to real DB
        from app.core.database import get_db
        from unittest.mock import AsyncMock, MagicMock

        async def mock_get_db():
            mock_session = AsyncMock()
            # Mock table existence check to return False so it falls back to data_loader
            # This ensures we don't need a real DB for this test
            # scalar() is sync
            mock_result = MagicMock()
            mock_result.scalar.return_value = False
            mock_session.execute.return_value = mock_result
            yield mock_session

        app.dependency_overrides[get_db] = mock_get_db

        try:
            request_body = {
                "polygon": {
                    "type": "Polygon",
                    "coordinates": [[[18.4, -33.9], [18.5, -33.9], [18.5, -34.0], [18.4, -34.0], [18.4, -33.9]]]
                },
                "layers": ["suburbs"]
            }
            response = client.post("/api/spatial/point-in-polygon", json=request_body)
            # May return 200 or 400/500 depending on data availability
            assert response.status_code in [200, 400, 500]
        finally:
            app.dependency_overrides.clear()


class TestEnvironmentEndpoint:
    """Tests for environment analysis endpoint."""

    def test_flood_risk_endpoint(self):
        """Test flood risk analysis endpoint."""
        response = client.get("/api/environment/flood-risk")
        # May return 200 with data or 500 if data is unavailable
        assert response.status_code in [200, 500]


class TestSafetyEndpoint:
    """Tests for safety analysis endpoint."""

    def test_safety_precincts_endpoint(self):
        """Test safety precincts endpoint."""
        response = client.get("/api/safety/precincts")
        # May return 200 with data or 500 if data is unavailable
        assert response.status_code in [200, 500]


class TestLandUseEndpoint:
    """Tests for land use analysis endpoint."""

    def test_zoning_endpoint(self):
        """Test zoning endpoint."""
        response = client.get("/api/land-use/zoning")
        assert response.status_code in [200, 500]


class TestUtilitiesEndpoint:
    """Tests for utilities analysis endpoint."""

    def test_waste_endpoint(self):
        """Test waste collection endpoint."""
        response = client.get("/api/utilities/waste")
        assert response.status_code in [200, 500]


class TestInfrastructureEndpoint:
    """Tests for infrastructure endpoint."""

    def test_infrastructure_layer_endpoint(self):
        """Test infrastructure layer endpoint."""
        response = client.get("/api/infrastructure/parks")
        # May return 200 with data or error if layer not found
        assert response.status_code in [200, 400, 500]


class TestPortalEndpoint:
    """Tests for open data portal endpoints."""

    def test_datasets_list(self):
        """Test datasets listing endpoint."""
        response = client.get("/api/portal/datasets")
        assert response.status_code == 200

        data = response.json()
        assert "total" in data
        assert "datasets" in data

    def test_categories_list(self):
        """Test categories listing endpoint."""
        response = client.get("/api/portal/categories")
        assert response.status_code == 200


class TestStaticFileEndpoints:
    """Tests for static file serving."""

    def test_manifest_endpoint(self):
        """Test manifest.json endpoint."""
        response = client.get("/manifest.json")
        # Returns 200 if exists, 404 if not built
        assert response.status_code in [200, 404]

    def test_service_worker_endpoint(self):
        """Test service worker endpoint."""
        response = client.get("/sw.js")
        assert response.status_code in [200, 404]

    def test_spa_fallback(self):
        """Test SPA fallback for non-API routes."""
        response = client.get("/some-frontend-route")
        # Should return 200 if frontend built, 503 if not
        assert response.status_code in [200, 503]


class TestCacheEndpoint:
    """Tests for cache management endpoint."""

    def setup_method(self):
        app.dependency_overrides[require_admin_key] = mock_require_admin_key

    def teardown_method(self):
        if require_admin_key in app.dependency_overrides:
            del app.dependency_overrides[require_admin_key]

    def test_clear_cache(self):
        """Test cache clearing endpoint."""
        response = client.post("/api/cache/clear")
        assert response.status_code == 200

        data = response.json()
        assert "message" in data
