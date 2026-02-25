import sys
from unittest.mock import MagicMock
import types

# Helper to mock packages
def mock_package(name):
    if name not in sys.modules:
        m = MagicMock()
        m.__path__ = []
        sys.modules[name] = m
    return sys.modules[name]

# Mock sqlalchemy and its submodules
mock_sqlalchemy = mock_package('sqlalchemy')
mock_package('sqlalchemy.orm')
mock_package('sqlalchemy.ext')
mock_package('sqlalchemy.ext.asyncio')
mock_package('sqlalchemy.sql')

# Define common attributes used in imports
mock_sqlalchemy.Column = MagicMock()
mock_sqlalchemy.Integer = MagicMock()
mock_sqlalchemy.String = MagicMock()
mock_sqlalchemy.Float = MagicMock()
mock_sqlalchemy.DateTime = MagicMock()
mock_sqlalchemy.JSON = MagicMock()
mock_sqlalchemy.Boolean = MagicMock()
mock_sqlalchemy.Text = MagicMock()
mock_sqlalchemy.Index = MagicMock()
mock_sqlalchemy.func = MagicMock()
mock_sqlalchemy.text = MagicMock()
mock_sqlalchemy.cast = MagicMock()
mock_sqlalchemy.create_engine = MagicMock()

# Mock specific submodules/attributes
sys.modules['sqlalchemy.orm'].declarative_base = MagicMock(return_value=MagicMock)
sys.modules['sqlalchemy.orm'].sessionmaker = MagicMock()

sys.modules['sqlalchemy.ext.asyncio'].create_async_engine = MagicMock()
sys.modules['sqlalchemy.ext.asyncio'].AsyncSession = MagicMock()
sys.modules['sqlalchemy.ext.asyncio'].async_sessionmaker = MagicMock()
sys.modules['sqlalchemy.ext.asyncio'].AsyncEngine = MagicMock()

sys.modules['sqlalchemy.sql'].func = MagicMock()

# Mock geoalchemy2
mock_geoalchemy2 = mock_package('geoalchemy2')
mock_package('geoalchemy2.shape')

mock_geoalchemy2.Geometry = MagicMock()
mock_geoalchemy2.Geography = MagicMock()
sys.modules['geoalchemy2.shape'].to_shape = MagicMock()

# Mock shapely
mock_package('shapely')
mock_package('shapely.geometry')
sys.modules['shapely.geometry'].mapping = MagicMock()

import unittest
from unittest.mock import patch
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer

class TestUtilitiesSuitability(unittest.TestCase):
    def setUp(self):
        self.analyzer = SiteSuitabilityAnalyzer()

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_utilities_success(self, mock_func, mock_session_local):
        # Setup mock session
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Mock distances: 300m for water (100 score), 1250m for electricity (50 score)
        # (1250 - 500) / 15 = 750 / 15 = 50. 100 - 50 = 50.
        # Average: (100 + 50) / 2 = 75.0
        mock_session.query.return_value.filter.return_value.order_by.return_value.limit.return_value.scalar.side_effect = [300.0, 1250.0]

        result = self.analyzer._eval_utilities(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 75.0)
        self.assertEqual(result.data_source, "postgis")
        self.assertTrue(result.details["water_available"])
        self.assertFalse(result.details["electricity_available"])
        self.assertEqual(result.details["water_distance_m"], 300.0)
        self.assertEqual(result.details["electricity_distance_m"], 1250.0)

        # Verify session was closed
        mock_session.close.assert_called_once()

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_utilities_no_facilities(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Mock no facilities found (return None)
        mock_session.query.return_value.filter.return_value.order_by.return_value.limit.return_value.scalar.return_value = None

        result = self.analyzer._eval_utilities(-33.9249, 18.4241, "residential")

        # Default distance is 5000m, so score should be 0.0
        self.assertEqual(result.score, 0.0)
        self.assertEqual(result.data_source, "postgis")
        self.assertFalse(result.details["water_available"])
        self.assertFalse(result.details["electricity_available"])
        self.assertEqual(result.details["water_distance_m"], 5000.0)

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_utilities_db_error(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Simulate DB error
        mock_session.query.side_effect = Exception("DB Connection Failed")

        result = self.analyzer._eval_utilities(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 70)
        self.assertEqual(result.data_source, "error")
        self.assertIn("DB Connection Failed", result.details["note"])

        mock_session.close.assert_called_once()

    def test_eval_utilities_no_session_local(self):
        # Patch SessionLocal to be None
        with patch("app.spatial_analysis.site_suitability.SessionLocal", None):
            result = self.analyzer._eval_utilities(-33.9249, 18.4241, "residential")

            self.assertEqual(result.score, 70)
            self.assertEqual(result.data_source, "placeholder")

if __name__ == "__main__":
    unittest.main()
