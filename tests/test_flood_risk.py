import unittest
from unittest.mock import patch, MagicMock
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer

class TestFloodRisk(unittest.TestCase):
    def setUp(self):
        self.analyzer = SiteSuitabilityAnalyzer()

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_flood_risk_no_intersection(self, mock_func, mock_session_local):
        # Setup mock session
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Mock query result to return None (no intersection)
        mock_session.query.return_value.filter.return_value.first.return_value = None

        result = self.analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 90)
        self.assertEqual(result.data_source, "postgis")
        self.assertFalse(result.details["in_flood_zone"])
        self.assertEqual(result.details["risk_level"], "Low")

        # Verify session was closed
        mock_session.close.assert_called_once()

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_flood_risk_intersection(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Mock flood zone area
        mock_area = MagicMock()
        mock_area.risk_level = "High"
        mock_area.return_period = "1:100 year"

        mock_session.query.return_value.filter.return_value.first.return_value = mock_area

        result = self.analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 10)
        self.assertTrue(result.details["in_flood_zone"])
        self.assertEqual(result.details["risk_level"], "High")
        self.assertIn("High Flood Risk", result.constraints)
        self.assertEqual(result.data_source, "postgis")

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_flood_risk_db_error(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Simulate DB error
        mock_session.query.side_effect = Exception("DB Connection Failed")

        result = self.analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")

        # Fallback score (from placeholder/default)
        self.assertEqual(result.score, 85)
        self.assertEqual(result.data_source, "error")
        self.assertIn("DB Connection Failed", result.details["note"])

        mock_session.close.assert_called_once()

    def test_eval_flood_risk_no_session_local(self):
        # Patch SessionLocal to be None
        with patch("app.spatial_analysis.site_suitability.SessionLocal", None):
            result = self.analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")

            self.assertEqual(result.score, 85)
            self.assertEqual(result.data_source, "placeholder")
