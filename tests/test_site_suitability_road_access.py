import sys
from unittest.mock import MagicMock

# Mock external dependencies that might be missing
mock_sqlalchemy = MagicMock()
mock_text = MagicMock()
mock_sqlalchemy.text = mock_text
sys.modules["sqlalchemy"] = mock_sqlalchemy

mock_database = MagicMock()
mock_require_engine = MagicMock()
mock_database.require_engine = mock_require_engine
sys.modules["app.core.database"] = mock_database

import unittest
# Now import the module under test
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer, CriterionResult, SuitabilityCriterion

class TestSiteSuitabilityRoadAccess(unittest.TestCase):

    def setUp(self):
        self.analyzer = SiteSuitabilityAnalyzer()

    def test_eval_road_access_success(self):
        # Mock database connection and result
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Test case: 30m distance (Excellent)
        mock_connection.execute.return_value.fetchone.return_value = ('highway', 30.0)

        result = self.analyzer._eval_road_access(-33.92, 18.42, "residential")

        self.assertEqual(result.criterion, "road_access")
        self.assertEqual(result.score, 100)
        self.assertEqual(result.details['access_quality'], "Excellent")
        self.assertEqual(result.details['nearest_road_class'], "highway")
        self.assertEqual(result.data_source, "postgis")
        self.assertEqual(result.details['distance_to_road_m'], 30.0)

    def test_eval_road_access_moderate(self):
        # Mock database connection and result
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Test case: 300m distance (Moderate)
        mock_connection.execute.return_value.fetchone.return_value = ('secondary', 300.0)

        result = self.analyzer._eval_road_access(-33.92, 18.42, "residential")

        self.assertEqual(result.score, 60)
        self.assertEqual(result.details['access_quality'], "Moderate")
        self.assertEqual(result.details['distance_to_road_m'], 300.0)

    def test_eval_road_access_very_poor(self):
        # Mock database connection and result
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Test case: 1200m distance (Very Poor)
        mock_connection.execute.return_value.fetchone.return_value = ('path', 1200.0)

        result = self.analyzer._eval_road_access(-33.92, 18.42, "residential")

        self.assertEqual(result.score, 20)
        self.assertEqual(result.details['access_quality'], "Very Poor")

    def test_eval_road_access_no_roads_found(self):
        # Mock database connection and result
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Test case: No result
        mock_connection.execute.return_value.fetchone.return_value = None

        result = self.analyzer._eval_road_access(-33.92, 18.42, "residential")

        self.assertEqual(result.score, 0)
        self.assertEqual(result.details['access_quality'], "No Access")
        self.assertIn("No road access", result.constraints)
        self.assertEqual(result.data_source, "postgis")

    def test_eval_road_access_db_error(self):
        # Mock database connection to raise exception
        mock_require_engine.side_effect = Exception("DB Connection Failed")

        with self.assertRaises(Exception):
            self.analyzer._eval_road_access(-33.92, 18.42, "residential")

        # Reset side effect for other tests
        mock_require_engine.side_effect = None

if __name__ == '__main__':
    unittest.main()
