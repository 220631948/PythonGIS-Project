import unittest
from unittest.mock import MagicMock, patch, ANY
import geopandas as gpd
from shapely.geometry import Point
from app.core.data_loader import DataLoader
from app.core.exceptions import DataNotFoundError

class TestDataLoaderPagination(unittest.TestCase):

    def setUp(self):
        self.loader = DataLoader()
        self.loader.data_urls = {"test_dataset": "http://example.com/data.geojson"}

    @patch("app.core.data_loader.gpd.read_postgis")
    @patch("app.core.data_loading.storage.require_engine")
    def test_get_paginated_gdf_postgis_success(self, mock_require_engine, mock_read_postgis):
        # Mock table exists: The first execute call is for table_exists
        # The second execute call is for get_record_count

        mock_conn = MagicMock()
        mock_engine = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_conn

        # Setup side effects for execute results
        # First call: table_exists -> True
        # Second call: get_record_count -> 100
        mock_result_exists = MagicMock()
        mock_result_exists.scalar.return_value = True

        mock_result_count = MagicMock()
        mock_result_count.scalar.return_value = 100

        mock_conn.execute.side_effect = [mock_result_exists, mock_result_count]

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

        # Verify table_exists query was executed
        # We check execute call count
        self.assertEqual(mock_conn.execute.call_count, 2)

        # Verify the table existence check query
        exists_call_args = mock_conn.execute.call_args_list[0]
        # execute(text(...), params)
        # exists_call_args[0][0] is the text object. str(text_obj) gives the SQL.
        self.assertIn("SELECT EXISTS", str(exists_call_args[0][0]))
        self.assertIn("information_schema.tables", str(exists_call_args[0][0]))
        self.assertEqual(exists_call_args[0][1], {"table_name": dataset_name})

        mock_read_postgis.assert_called_once()
        args, kwargs = mock_read_postgis.call_args
        self.assertIn(f"SELECT * FROM \"{dataset_name}\" LIMIT %(limit)s OFFSET %(offset)s", args[0])
        self.assertEqual(kwargs["params"], {"limit": limit, "offset": offset})

    @patch("app.core.data_loader.DataLoader.get_gdf")
    @patch("app.core.data_loading.storage.require_engine")
    def test_get_paginated_gdf_fallback(self, mock_require_engine, mock_get_gdf):
        # Mock table DOES NOT exist
        mock_conn = MagicMock()
        mock_engine = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_conn

        mock_result_exists = MagicMock()
        mock_result_exists.scalar.return_value = False

        mock_conn.execute.return_value = mock_result_exists

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

        # Verify get_gdf was called as fallback
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
