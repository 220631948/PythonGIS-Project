"""
Integration tests for live open data sources.

These tests verify that:
1. Open data endpoints are accessible
2. Data schemas are valid
3. Spatial data has valid geometries
4. API responses contain expected structure

Note: These tests make real network requests to open data portals.
They may fail if the external services are temporarily unavailable.
"""

import pytest
import requests
from datetime import datetime
import json

# Test configuration - Updated to use verified working City of Cape Town MapServer endpoints
OPEN_DATA_SOURCES = {
    "suburbs": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/75/query?where=1%3D1&outFields=*&resultRecordCount=10&f=geojson",
    "myciti_stops": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/96/query?where=1%3D1&outFields=*&resultRecordCount=10&f=geojson",
    "clinics": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/44/query?where=1%3D1&outFields=*&resultRecordCount=10&f=geojson",
    "schools": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/26/query?where=1%3D1&outFields=*&resultRecordCount=10&f=geojson",
    "parks": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/29/query?where=1%3D1&outFields=*&resultRecordCount=10&f=geojson"
}

TIMEOUT = 30  # seconds


class TestOpenDataSourceAccessibility:
    """Test that open data sources are accessible."""

    @pytest.mark.parametrize("dataset_name,url", list(OPEN_DATA_SOURCES.items()))
    def test_source_is_accessible(self, dataset_name, url):
        """Verify that each open data source responds to requests."""
        try:
            response = requests.head(url, timeout=TIMEOUT, allow_redirects=True)
            # Accept 200 or redirects (301, 302) as valid
            assert response.status_code in [200, 301, 302, 307], \
                f"Unexpected status code {response.status_code} for {dataset_name}"
        except requests.exceptions.Timeout:
            pytest.skip(f"Timeout accessing {dataset_name} - service may be slow")
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Failed to access {dataset_name}: {e}")


class TestOpenDataSchemaValidation:
    """Test that open data responses have valid GeoJSON structure."""

    @pytest.mark.parametrize("dataset_name,url", [
        ("suburbs", OPEN_DATA_SOURCES["suburbs"]),
        ("myciti_stops", OPEN_DATA_SOURCES["myciti_stops"]),
    ])
    def test_geojson_structure(self, dataset_name, url):
        """Verify GeoJSON response has correct structure."""
        try:
            response = requests.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            data = response.json()

            # Check GeoJSON structure
            assert "type" in data, f"Missing 'type' in {dataset_name} response"
            assert data["type"] == "FeatureCollection", f"Expected FeatureCollection, got {data['type']}"
            assert "features" in data, f"Missing 'features' in {dataset_name} response"
            assert isinstance(data["features"], list), f"Features should be a list in {dataset_name}"

            if len(data["features"]) > 0:
                feature = data["features"][0]
                assert "type" in feature, "Feature missing 'type'"
                assert feature["type"] == "Feature", f"Expected Feature, got {feature['type']}"
                assert "geometry" in feature, "Feature missing 'geometry'"
                assert "properties" in feature, "Feature missing 'properties'"

        except requests.exceptions.Timeout:
            pytest.skip(f"Timeout accessing {dataset_name}")
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Request failed for {dataset_name}: {e}")
        except json.JSONDecodeError as e:
            pytest.fail(f"Invalid JSON from {dataset_name}: {e}")


class TestOpenDataGeometryValidation:
    """Test that spatial data has valid geometries."""

    def test_suburbs_has_polygon_geometries(self):
        """Verify suburbs dataset contains polygon geometries."""
        try:
            response = requests.get(OPEN_DATA_SOURCES["suburbs"], timeout=TIMEOUT)
            response.raise_for_status()
            data = response.json()

            features = data.get("features", [])
            assert len(features) > 0, "No features in suburbs dataset"

            # Check geometry types
            geometry_types = set()
            for feature in features[:10]:  # Check first 10
                geom = feature.get("geometry", {})
                if geom:
                    geometry_types.add(geom.get("type"))

            # Suburbs should have polygon or multipolygon geometries
            valid_types = {"Polygon", "MultiPolygon"}
            assert geometry_types.intersection(valid_types), \
                f"Expected polygon geometries, got {geometry_types}"

        except requests.exceptions.RequestException:
            pytest.skip("Could not access suburbs data")

    def test_myciti_stops_has_point_geometries(self):
        """Verify MyCiTi stops dataset contains point geometries."""
        try:
            response = requests.get(OPEN_DATA_SOURCES["myciti_stops"], timeout=TIMEOUT)
            response.raise_for_status()
            data = response.json()

            features = data.get("features", [])
            assert len(features) > 0, "No features in MyCiTi stops dataset"

            # Check first feature has point geometry
            first_geom = features[0].get("geometry", {})
            assert first_geom.get("type") == "Point", \
                f"Expected Point geometry, got {first_geom.get('type')}"

            # Verify coordinates are in Cape Town area (roughly)
            coords = first_geom.get("coordinates", [])
            if len(coords) >= 2:
                lon, lat = coords[0], coords[1]
                # Cape Town approximate bounds
                assert 18.0 < lon < 19.5, f"Longitude {lon} outside Cape Town area"
                assert -34.5 < lat < -33.5, f"Latitude {lat} outside Cape Town area"

        except requests.exceptions.RequestException:
            pytest.skip("Could not access MyCiTi stops data")


class TestOpenDataCompleteness:
    """Test that datasets have expected data completeness."""

    def test_suburbs_has_minimum_features(self):
        """Verify suburbs dataset has a reasonable number of features."""
        try:
            response = requests.get(OPEN_DATA_SOURCES["suburbs"], timeout=TIMEOUT)
            response.raise_for_status()
            data = response.json()

            feature_count = len(data.get("features", []))
            # Cape Town has many suburbs, expect at least 50
            assert feature_count >= 50, \
                f"Expected at least 50 suburbs, got {feature_count}"

        except requests.exceptions.RequestException:
            pytest.skip("Could not access suburbs data")

    def test_features_have_properties(self):
        """Verify features have non-empty properties."""
        try:
            response = requests.get(OPEN_DATA_SOURCES["clinics"], timeout=TIMEOUT)
            response.raise_for_status()
            data = response.json()

            features = data.get("features", [])
            if len(features) == 0:
                pytest.skip("No features in clinics dataset")

            # Check that at least some features have properties
            features_with_props = sum(
                1 for f in features
                if f.get("properties") and len(f.get("properties", {})) > 0
            )

            assert features_with_props > 0, "No features have properties"

        except requests.exceptions.RequestException:
            pytest.skip("Could not access clinics data")


class TestArcGISFeatureServiceAccess:
    """Test access to ArcGIS Feature Services."""

    def test_egis_feature_service_metadata(self):
        """Verify eGIS Feature Service returns valid metadata."""
        url = "https://egis.capetown.gov.za/arcgis/rest/services/Theme_Based/Open_Data_Service/FeatureServer?f=json"

        try:
            response = requests.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            data = response.json()

            # Check for expected metadata fields
            assert "layers" in data, "Missing 'layers' in FeatureServer response"
            assert isinstance(data["layers"], list), "Layers should be a list"
            assert len(data["layers"]) > 0, "No layers in FeatureServer"

            # Verify layer structure
            layer = data["layers"][0]
            assert "id" in layer, "Layer missing 'id'"
            assert "name" in layer, "Layer missing 'name'"

        except requests.exceptions.RequestException:
            pytest.skip("Could not access eGIS Feature Service")


class TestDataCurrencyAndFreshness:
    """Test that data appears current and maintained."""

    def test_response_headers_indicate_freshness(self):
        """Check for cache or date headers indicating data freshness."""
        try:
            response = requests.head(
                OPEN_DATA_SOURCES["suburbs"],
                timeout=TIMEOUT,
                allow_redirects=True
            )

            # Log available headers for debugging
            headers = dict(response.headers)

            # Many responses will have date headers
            if "Last-Modified" in headers:
                # Data should be from within the last year
                # (just a sanity check, not strict requirement)
                print(f"Last-Modified: {headers['Last-Modified']}")

            if "Date" in headers:
                print(f"Response Date: {headers['Date']}")

            # If we get a response, the service is active
            assert response.status_code in [200, 301, 302, 307]

        except requests.exceptions.RequestException:
            pytest.skip("Could not access data source")


# Run with: pytest tests/test_open_data_integration.py -v
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
