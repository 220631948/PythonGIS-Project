"""
Tests for GeoDataFrame to GeoJSON conversion utilities.
Verifies structure, type handling (Timestamp, NaN, Numpy), and performance.
"""
import time
import pytest
try:
    import pandas as pd
    import numpy as np
    import geopandas as gpd
    from shapely.geometry import Point
except ImportError:
    pd = np = gpd = Point = None

# Only import if dependencies are available, otherwise mock or skip
try:
    from app.spatial_analysis.spatial_utils import gdf_to_geojson, gdf_to_geojson_str
except ImportError:
    gdf_to_geojson = None
    gdf_to_geojson_str = None

@pytest.mark.skipif(pd is None, reason="pandas/geopandas/shapely not installed")
class TestGdfToGeoJson:
    """Tests for gdf_to_geojson and gdf_to_geojson_str."""

    def test_basic_conversion(self):
        """Test basic conversion with standard types."""
        df = pd.DataFrame({
            'id': [1, 2],
            'name': ['A', 'B']
        })
        gdf = gpd.GeoDataFrame(
            df,
            geometry=[Point(0, 0), Point(1, 1)],
            crs="EPSG:4326"
        )

        geojson = gdf_to_geojson(gdf)

        assert geojson['type'] == 'FeatureCollection'
        assert len(geojson['features']) == 2

        feat0 = geojson['features'][0]
        assert feat0['type'] == 'Feature'
        # Verify ID is preserved (as string of index)
        # Default index is 0, 1
        assert feat0['id'] == '0'
        assert feat0['properties']['name'] == 'A'
        assert feat0['geometry']['type'] == 'Point'

    def test_nan_handling(self):
        """Test that NaN values are converted to null."""
        df = pd.DataFrame({
            'value': [np.nan, 1.0]
        })
        gdf = gpd.GeoDataFrame(
            df,
            geometry=[Point(0, 0), Point(1, 1)],
            crs="EPSG:4326"
        )

        geojson = gdf_to_geojson(gdf)

        feat0 = geojson['features'][0]
        assert feat0['properties']['value'] is None

    def test_timestamp_handling(self):
        """Test that Timestamps are converted to ISO format strings."""
        ts = pd.Timestamp('2023-01-01 12:00:00')
        df = pd.DataFrame({
            'date': [ts]
        })
        gdf = gpd.GeoDataFrame(
            df,
            geometry=[Point(0, 0)],
            crs="EPSG:4326"
        )

        # This might fail with current implementation if gdf_to_geojson_str is used directly
        # But gdf_to_geojson returns dict, which is fine until serialized
        geojson = gdf_to_geojson(gdf)

        # Check if it's string or Timestamp object
        val = geojson['features'][0]['properties']['date']

        # Optimization: Timestamp should be converted to ISO string
        assert isinstance(val, str), "Timestamp should be converted to string in optimized implementation"

        # Verify serialization works without errors
        import json
        try:
            json.dumps(geojson)
        except TypeError as e:
            pytest.fail(f"Resulting GeoJSON dict is not JSON serializable: {e}")

    def test_numpy_types(self):
        """Test handling of numpy integers and floats."""
        df = pd.DataFrame({
            'int_val': np.array([1, 2], dtype=np.int64),
            'float_val': np.array([1.1, 2.2], dtype=np.float64)
        })
        gdf = gpd.GeoDataFrame(
            df,
            geometry=[Point(0, 0), Point(1, 1)],
            crs="EPSG:4326"
        )

        geojson = gdf_to_geojson(gdf)

        feat0 = geojson['features'][0]
        assert feat0['properties']['int_val'] == 1
        assert feat0['properties']['float_val'] == 1.1

    def test_performance_benchmark(self):
        """Simple benchmark to ensure conversion is reasonably fast."""
        n = 5000 # Enough to measure, not too slow for tests
        df = pd.DataFrame({
            'id': range(n),
            'value': np.random.randn(n)
        })
        gdf = gpd.GeoDataFrame(
            df,
            geometry=[Point(x, y) for x, y in zip(np.random.randn(n), np.random.randn(n))],
            crs="EPSG:4326"
        )

        start_time = time.time()
        _ = gdf_to_geojson(gdf)
        duration = time.time() - start_time

        print(f"Conversion of {n} features took {duration:.4f} seconds")

        # Loose assertion, mainly for visibility
        assert duration < 5.0
