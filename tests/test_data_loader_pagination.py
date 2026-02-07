import unittest
from unittest.mock import MagicMock, patch
import geopandas as gpd
from shapely.geometry import Point
from app.core.data_loader import DataLoader
from app.core.exceptions import DataNotFoundError

class TestDataLoaderPagination(unittest.TestCase):

    def setUp(self):
        self.loader = DataLoader()
        self.loader.data_urls = {"test_dataset": "http://example.com/data.geojson"}

    @patch("app.core.data_loader.gpd.read_postgis")
    @patch("app.core.data_loader.engine")
    @patch("app.core.data_loader.inspect")
    def test_get_paginated_gdf_postgis_success(self, mock_inspect, mock_engine, mock_read_postgis):
        # Mock table exists
        mock_inspector = MagicMock()
        mock_inspect.return_value = mock_inspector
        mock_inspector.get_table_names.return_value = ["test_dataset"]

        # Mock total count query
        mock_conn = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn
        mock_result = MagicMock()
        mock_result.scalar.return_value = 100
        mock_conn.execute.return_value = mock_result

        # Mock read_postgis result
        mock_gdf = gpd.GeoDataFrame(
            {"col1": range(10), "geometry": [Point(0,0)]*10}
        )
        mock_read_postgis.return_value = mock_gdf

        # Call method
        dataset_name = "test_dataset"
        limit = 10
        offset = 0
        gdf, total = self.loader.get_paginated_gdf(dataset_name, limit, offset)

        # Assertions
        self.assertEqual(total, 100)
        self.assertEqual(len(gdf), 10)
        mock_read_postgis.assert_called_once()
        args, kwargs = mock_read_postgis.call_args
        self.assertIn(f"SELECT * FROM {dataset_name} LIMIT %(limit)s OFFSET %(offset)s", args[0])
        self.assertEqual(kwargs["params"], {"limit": limit, "offset": offset})

    @patch("app.core.data_loader.DataLoader.get_gdf")
    @patch("app.core.data_loader.inspect")
    def test_get_paginated_gdf_fallback(self, mock_inspect, mock_get_gdf):
        # Mock table DOES NOT exist
        mock_inspector = MagicMock()
        mock_inspect.return_value = mock_inspector
        mock_inspector.get_table_names.return_value = []

        # Mock get_gdf returning full dataframe
        full_gdf = gpd.GeoDataFrame(
            {"col1": range(20), "geometry": [Point(0,0)]*20}
        )
        mock_get_gdf.return_value = full_gdf

        # Call method
        dataset_name = "test_dataset"
        limit = 5
        offset = 5
        gdf, total = self.loader.get_paginated_gdf(dataset_name, limit, offset)

        # Assertions
        self.assertEqual(total, 20)
        self.assertEqual(len(gdf), 5)
        # Check slice content (indices should be 5 to 9)
        self.assertEqual(gdf.iloc[0]["col1"], 5)
        self.assertEqual(gdf.iloc[-1]["col1"], 9)

        mock_get_gdf.assert_called_once_with(dataset_name, force_refresh=False)

    def test_get_paginated_gdf_security_check(self):
        dataset_name = "malicious_table"
        # Ensure it's not in data_urls
        if dataset_name in self.loader.data_urls:
            del self.loader.data_urls[dataset_name]

        with self.assertRaises(DataNotFoundError):
            self.loader.get_paginated_gdf(dataset_name)

if __name__ == "__main__":
    unittest.main()
