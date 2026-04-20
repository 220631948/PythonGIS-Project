"""
Test Suite for Advanced Features APIs

Tests for:
- Collaboration API
- Export API
- Field Data API
- Metadata Catalog API
- Advanced Analysis API
- Realtime Data API
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import sys
import os
import unittest.mock
from unittest.mock import patch
import geopandas as gpd
from shapely.geometry import Point

# Add the project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)


class TestCollaborationAPI:
    """Tests for the Collaboration API endpoints"""

    def test_list_annotations_empty(self):
        """Test listing annotations when empty"""
        response = client.get("/api/collaboration/annotations")
        assert response.status_code == 200
        data = response.json()
        assert "annotations" in data
        assert "total" in data

    def test_create_annotation(self):
        """Test creating a new annotation"""
        annotation = {
            "location": {"lat": -33.9249, "lng": 18.4241},
            "annotation_type": "comment",
            "title": "Test Annotation",
            "content": "This is a test comment for the location",
            "author": "Test User",
            "tags": ["test", "demo"]
        }
        response = client.post("/api/collaboration/annotations", json=annotation)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Annotation"
        assert data["author"] == "Test User"
        assert "id" in data
        return data["id"]

    def test_get_annotation(self):
        """Test getting a specific annotation"""
        # First create one
        annotation = {
            "location": {"lat": -33.9249, "lng": 18.4241},
            "annotation_type": "note",
            "title": "Get Test",
            "content": "Testing get endpoint",
            "author": "Tester"
        }
        create_response = client.post("/api/collaboration/annotations", json=annotation)
        annotation_id = create_response.json()["id"]

        # Then get it
        response = client.get(f"/api/collaboration/annotations/{annotation_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Get Test"

    def test_update_annotation(self):
        """Test updating an annotation"""
        # Create
        annotation = {
            "location": {"lat": -33.9249, "lng": 18.4241},
            "annotation_type": "issue",
            "title": "Update Test",
            "content": "Will be updated",
            "author": "Updater"
        }
        create_response = client.post("/api/collaboration/annotations", json=annotation)
        annotation_id = create_response.json()["id"]

        # Update
        update_data = {"title": "Updated Title", "status": "resolved"}
        response = client.patch(f"/api/collaboration/annotations/{annotation_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["status"] == "resolved"

    def test_create_reply(self):
        """Test creating a reply to an annotation"""
        # Create annotation
        annotation = {
            "location": {"lat": -33.9249, "lng": 18.4241},
            "annotation_type": "comment",
            "title": "Reply Test",
            "content": "Testing replies",
            "author": "Original"
        }
        create_response = client.post("/api/collaboration/annotations", json=annotation)
        annotation_id = create_response.json()["id"]

        # Create reply
        reply = {"content": "This is a reply", "author": "Replier"}
        response = client.post(f"/api/collaboration/annotations/{annotation_id}/replies", json=reply)
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "This is a reply"

    def test_get_replies(self):
        """Test getting replies for an annotation"""
        # Create annotation
        annotation = {
            "location": {"lat": -33.9249, "lng": 18.4241},
            "annotation_type": "comment",
            "title": "Replies List Test",
            "content": "Testing replies list",
            "author": "Author"
        }
        create_response = client.post("/api/collaboration/annotations", json=annotation)
        annotation_id = create_response.json()["id"]

        # Add replies
        client.post(f"/api/collaboration/annotations/{annotation_id}/replies",
                   json={"content": "Reply 1", "author": "User1"})
        client.post(f"/api/collaboration/annotations/{annotation_id}/replies",
                   json={"content": "Reply 2", "author": "User2"})

        # Get replies
        response = client.get(f"/api/collaboration/annotations/{annotation_id}/replies")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_create_marker(self):
        """Test creating a project marker"""
        marker = {
            "name": "Test Marker",
            "lat": -33.9249,
            "lng": 18.4241,
            "description": "A test marker",
            "icon": "star",
            "color": "#ff0000",
            "created_by": "Tester"
        }
        response = client.post("/api/collaboration/markers", json=marker)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Marker"

    def test_list_markers(self):
        """Test listing project markers"""
        response = client.get("/api/collaboration/markers")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_collaboration_stats(self):
        """Test getting collaboration statistics"""
        response = client.get("/api/collaboration/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_annotations" in data
        assert "total_markers" in data


class TestExportAPI:
    """Tests for the Export API endpoints"""

    def test_list_export_formats(self):
        """Test listing available export formats"""
        response = client.get("/api/export/formats")
        assert response.status_code == 200
        data = response.json()
        assert "formats" in data
        format_ids = [f["id"] for f in data["formats"]]
        assert "csv" in format_ids
        assert "geojson" in format_ids

    @patch("app.core.data_loader.DataLoader.get_gdf")
    def test_export_data_geojson(self, mock_get_gdf):
        """Test exporting data as GeoJSON"""
        # Mock the GDF
        mock_gdf = gpd.GeoDataFrame(
            {"col1": [1, 2], "geometry": [Point(0, 0), Point(1, 1)]}, crs="EPSG:4326"
        )
        mock_get_gdf.return_value = mock_gdf

        request = {
            "dataset": "suburbs",
            "format": "geojson"
        }
        response = client.post("/api/export/data", json=request)
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data
        assert "download_url" in data
        assert data["format"] == "geojson"

    @patch("app.core.data_loader.DataLoader.get_gdf")
    def test_export_data_csv(self, mock_get_gdf):
        """Test exporting data as CSV"""
        # Mock the GDF
        mock_gdf = gpd.GeoDataFrame(
            {"col1": [1, 2], "geometry": [Point(0, 0), Point(1, 1)]}, crs="EPSG:4326"
        )
        mock_get_gdf.return_value = mock_gdf

        request = {
            "dataset": "suburbs",
            "format": "csv"
        }
        response = client.post("/api/export/data", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "csv"

    @patch("app.core.data_loader.DataLoader.get_gdf")
    def test_export_analysis(self, mock_get_gdf):
        """Test exporting analysis results"""
        # Mock the GDF
        mock_gdf = gpd.GeoDataFrame(
            {
                "suitability": [0.8, 0.5],
                "geometry": [Point(18.4, -33.9), Point(18.5, -33.95)],
            },
            crs="EPSG:4326",
        )
        mock_get_gdf.return_value = mock_gdf

        request = {
            "analysis_type": "suitability",
            "format": "geojson",
            "parameters": {
                "lat": -33.9249,
                "lng": 18.4241,
                "development_type": "residential"
            }
        }
        # Note: Suitability analysis might not call get_gdf directly but generate its own result.
        # If it does call get_gdf (e.g. for base layers), this mock handles it.
        # If it calls something else, we might need more mocks.
        # For now, let's try running it.
        response = client.post("/api/export/analysis", json=request)
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data

    @patch("app.core.data_loader.DataLoader.get_gdf")
    def test_download_export(self, mock_get_gdf):
        """Test downloading an export"""
        # Mock the GDF
        mock_gdf = gpd.GeoDataFrame(
            {"col1": [1, 2], "geometry": [Point(0, 0), Point(1, 1)]}, crs="EPSG:4326"
        )
        mock_get_gdf.return_value = mock_gdf

        # First create an export
        request = {"dataset": "suburbs", "format": "geojson"}
        export_response = client.post("/api/export/data", json=request)
        file_id = export_response.json()["file_id"]

        # Then download it
        response = client.get(f"/api/export/download/{file_id}")
        assert response.status_code == 200

    def test_list_pending_exports(self):
        """Test listing pending exports"""
        response = client.get("/api/export/pending")
        assert response.status_code == 200
        data = response.json()
        assert "exports" in data


class TestFieldDataAPI:
    """Tests for the Field Data API endpoints"""

    def test_list_forms(self):
        """Test listing available field survey forms"""
        response = client.get("/api/field/forms")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0  # Should have default forms
        assert any(f["id"] == "infrastructure_survey" for f in data)

    def test_get_form(self):
        """Test getting a specific form"""
        response = client.get("/api/field/forms/infrastructure_survey")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Infrastructure Survey"
        assert len(data["fields"]) > 0

    def test_submit_entry(self):
        """Test submitting a field data entry"""
        entry = {
            "form_id": "infrastructure_survey",
            "location": {"lat": -33.9249, "lng": 18.4241, "accuracy": 10},
            "attributes": {
                "type": "Road",
                "condition": "Good",
                "description": "Test entry"
            },
            "collected_by": "Field Tester",
            "collected_at": datetime.utcnow().isoformat()
        }
        response = client.post("/api/field/entries", json=entry)
        assert response.status_code == 200
        data = response.json()
        assert data["form_id"] == "infrastructure_survey"
        assert data["status"] == "submitted"

    def test_list_entries(self):
        """Test listing field data entries"""
        response = client.get("/api/field/entries")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_sync_entries(self):
        """Test syncing multiple entries"""
        entries = [
            {
                "form_id": "infrastructure_survey",
                "location": {"lat": -33.9249, "lng": 18.4241, "accuracy": 10},
                "attributes": {"type": "Bridge", "condition": "Fair"},
                "collected_by": "Syncer",
                "collected_at": datetime.utcnow().isoformat(),
                "offline_id": "offline_1"
            },
            {
                "form_id": "environmental_observation",
                "location": {"lat": -33.9300, "lng": 18.4300, "accuracy": 15},
                "attributes": {"category": "Flooding", "severity": "High", "notes": "Test"},
                "collected_by": "Syncer",
                "collected_at": datetime.utcnow().isoformat(),
                "offline_id": "offline_2"
            }
        ]
        request = {"entries": entries, "sync_mode": "upsert"}
        response = client.post("/api/field/sync", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["synced"] == 2

    def test_create_offline_package(self):
        """Test creating an offline data package"""
        request = {
            "forms": ["infrastructure_survey"],
            "layers": ["suburbs"],
            "bbox": [18.3, -34.0, 18.5, -33.8]
        }
        response = client.post("/api/field/offline-package", json=request)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert len(data["forms"]) > 0

    def test_field_stats(self):
        """Test getting field data statistics"""
        response = client.get("/api/field/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_forms" in data
        assert "total_entries" in data


class TestMetadataAPI:
    """Tests for the Metadata Catalog API endpoints"""

    def test_list_datasets(self):
        """Test listing catalog datasets"""
        response = client.get("/api/catalog/datasets")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0

    def test_list_datasets_filtered(self):
        """Test filtering catalog datasets"""
        response = client.get("/api/catalog/datasets?category=Infrastructure")
        assert response.status_code == 200

    def test_get_dataset_metadata(self):
        """Test getting metadata for a specific dataset"""
        response = client.get("/api/catalog/datasets/suburbs")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "suburbs"
        assert "geometry_type" in data
        assert "attributes" in data

    def test_search_catalog(self):
        """Test searching the catalog"""
        query = {"q": "water", "page": 1, "page_size": 10}
        response = client.post("/api/catalog/search", json=query)
        assert response.status_code == 200
        data = response.json()
        assert "datasets" in data
        assert "total" in data
        assert "query_time_ms" in data

    def test_get_categories(self):
        """Test getting catalog categories"""
        response = client.get("/api/catalog/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_get_catalog_stats(self):
        """Test getting catalog statistics"""
        response = client.get("/api/catalog/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_datasets" in data
        assert "by_geometry_type" in data

    @patch('app.dependencies.settings.ADMIN_API_KEY', 'test_key')
    @patch('app.api.metadata_api._refresh_cache')
    def test_refresh_catalog(self, mock_refresh):
        """Test refreshing the catalog"""
        mock_refresh.return_value = None
        response = client.post("/api/catalog/refresh", headers={"X-Admin-API-Key": "test_key"})
        assert response.status_code == 200
        data = response.json()
        assert "dataset_count" in data


class TestAdvancedAnalysisAPI:
    """Tests for the Advanced Spatial Analysis API endpoints"""

    def test_viewshed_analysis(self):
        """Test viewshed calculation"""
        request = {
            "lat": -33.9249,
            "lng": 18.4241,
            "observer_height": 1.7,
            "max_distance": 5000,
            "resolution": 36
        }
        response = client.post("/api/analysis/viewshed", json=request)
        assert response.status_code == 200
        data = response.json()
        assert "viewshed" in data
        assert data["viewshed"]["type"] == "Feature"
        assert "rays" in data

    def test_visibility_check(self):
        """Test line-of-sight check"""
        response = client.get(
            "/api/analysis/visibility-check"
            "?from_lat=-33.9249&from_lng=18.4241"
            "&to_lat=-33.9350&to_lng=18.4350"
        )
        assert response.status_code == 200
        data = response.json()
        assert "is_visible" in data
        assert "distance_m" in data

    def test_topology_validate(self):
        """Test topology validation"""
        response = client.get("/api/analysis/topology/validate/suburbs")
        assert response.status_code == 200
        data = response.json()
        assert "is_valid" in data
        assert "issue_count" in data
        assert "issues" in data

    def test_route_calculation(self):
        """Test route calculation"""
        response = client.get(
            "/api/analysis/route"
            "?from_lat=-33.9249&from_lng=18.4241"
            "&to_lat=-33.9500&to_lng=18.4500"
            "&mode=driving"
        )
        assert response.status_code == 200
        data = response.json()
        assert "route" in data
        assert "summary" in data
        assert data["route"]["type"] == "Feature"

    def test_isochrone_calculation(self):
        """Test isochrone calculation"""
        response = client.get(
            "/api/analysis/isochrone"
            "?lat=-33.9249&lng=18.4241"
            "&time_minutes=15&mode=walking"
        )
        assert response.status_code == 200
        data = response.json()
        assert "isochrone" in data
        assert data["isochrone"]["type"] == "Feature"

    def test_nearest_facility(self):
        """Test nearest facility search"""
        response = client.get(
            "/api/analysis/nearest-facility"
            "?lat=-33.9249&lng=18.4241"
            "&facility_type=clinics&limit=3"
        )
        assert response.status_code == 200
        data = response.json()
        assert "facilities" in data


class TestRealtimeAPI:
    """Tests for the Realtime Data API endpoints"""

    def test_list_feeds(self):
        """Test listing realtime feeds"""
        response = client.get("/api/realtime/feeds")
        assert response.status_code == 200
        data = response.json()
        assert "feeds" in data
        assert len(data["feeds"]) > 0

    def test_get_feed_data(self):
        """Test getting data from a feed"""
        response = client.get("/api/realtime/feeds/traffic_status")
        assert response.status_code == 200
        data = response.json()
        assert "_feed_info" in data
        assert data["_feed_info"]["feed_id"] == "traffic_status"

    @patch('app.dependencies.settings.ADMIN_API_KEY', 'test_key')
    @patch('app.api.realtime_api._refresh_feed', new_callable=unittest.mock.AsyncMock)
    def test_refresh_feed(self, mock_refresh):
        """Test refreshing a feed"""
        mock_refresh.return_value = {"message": "success"}
        response = client.post("/api/realtime/feeds/weather_alerts/refresh", headers={"X-Admin-API-Key": "test_key"})
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_refresh_all_feeds(self):
        """Test refreshing all feeds"""
        response = client.post("/api/realtime/feeds/refresh-all")
        assert response.status_code == 200
        data = response.json()
        assert "refreshed_feeds" in data

    def test_get_status(self):
        """Test getting realtime status"""
        response = client.get("/api/realtime/status")
        assert response.status_code == 200
        data = response.json()
        assert "total_feeds" in data
        assert "active_feeds" in data

    def test_get_timestamps(self):
        """Test getting feed timestamps"""
        response = client.get("/api/realtime/timestamps")
        assert response.status_code == 200
        data = response.json()
        assert "timestamps" in data
        assert "server_time" in data


class TestHealthAndIntegration:
    """Integration tests for overall system health"""

    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    def test_config_endpoint(self):
        """Test config endpoint"""
        response = client.get("/api/config")
        assert response.status_code == 200
        data = response.json()
        assert "app_name" in data
        assert data["app_name"] == "Cape Town GeoHub"

    def test_suitability_analysis(self):
        """Test suitability analysis still works"""
        response = client.get(
            "/api/suitability/analyze"
            "?lat=-33.9249&lng=18.4241&development_type=residential"
        )
        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data
        assert "suitability_class" in data

    def test_portal_datasets(self):
        """Test portal datasets endpoint"""
        response = client.get("/api/portal/datasets")
        assert response.status_code == 200
        data = response.json()
        assert "datasets" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
