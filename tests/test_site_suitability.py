import unittest
from unittest.mock import MagicMock, patch
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer, CriterionResult
from app.core.database import DatabaseConnectionError

class TestSiteSuitability(unittest.TestCase):
    def setUp(self):
        self.analyzer = SiteSuitabilityAnalyzer()

    @patch("app.spatial_analysis.site_suitability.require_engine")
    def test_eval_transport_access_success(self, mock_require_engine):
        # Mock database connection and execution
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Set return values for the two queries (MyCiTi, Rail)
        # scalar() is called twice
        mock_connection.execute.return_value.scalar.side_effect = [300.0, 5000.0]

        result = self.analyzer._eval_transport_access(-33.92, 18.42, "residential")

        self.assertEqual(result.criterion, "transport_access")
        self.assertEqual(result.score, 100)  # < 400m
        self.assertEqual(result.details["nearest_transit_type"], "MyCiTi Bus")
        self.assertEqual(result.details["distance_to_transit_m"], 300.0)
        self.assertEqual(result.data_source, "postgis")

    @patch("app.spatial_analysis.site_suitability.require_engine")
    def test_eval_transport_access_rail_closer(self, mock_require_engine):
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # scalar() is called twice.
        # First call (MyCiTi) returns None (no stops) or far away
        # Second call (Rail) returns close
        mock_connection.execute.return_value.scalar.side_effect = [None, 600.0]

        result = self.analyzer._eval_transport_access(-33.92, 18.42, "residential")

        self.assertEqual(result.score, 80) # < 800m
        self.assertEqual(result.details["nearest_transit_type"], "Metrorail")
        self.assertEqual(result.details["distance_to_transit_m"], 600.0)

    @patch("app.spatial_analysis.site_suitability.require_engine")
    def test_eval_transport_access_no_data(self, mock_require_engine):
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Both return None
        mock_connection.execute.return_value.scalar.side_effect = [None, None]

        result = self.analyzer._eval_transport_access(-33.92, 18.42, "residential")

        self.assertEqual(result.score, 0)
        self.assertEqual(result.details["nearest_transit_type"], "None Found")
        self.assertEqual(result.data_source, "postgis")

    @patch("app.spatial_analysis.site_suitability.require_engine")
    def test_eval_transport_access_db_error(self, mock_require_engine):
        mock_require_engine.side_effect = DatabaseConnectionError("DB Error")

        result = self.analyzer._eval_transport_access(-33.92, 18.42, "residential")

        self.assertEqual(result.data_source, "placeholder")
        self.assertIn("Database Error", result.details["note"])

    @patch("app.spatial_analysis.site_suitability.require_engine")
    def test_eval_transport_access_table_missing(self, mock_require_engine):
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Mocking execute() itself to raise exception for the first call
        # The first call raises Exception
        # The second call returns a result proxy with scalar() -> 500.0
        mock_result = MagicMock()
        mock_result.scalar.return_value = 500.0

        mock_connection.execute.side_effect = [Exception("Table not found"), mock_result]

        result = self.analyzer._eval_transport_access(-33.92, 18.42, "residential")

        self.assertEqual(result.score, 80)
        self.assertEqual(result.details["nearest_transit_type"], "Metrorail")
        self.assertEqual(result.details["distance_to_transit_m"], 500.0)
