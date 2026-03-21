import sys
from unittest.mock import MagicMock

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

# Now we can import the app modules
import unittest
from unittest.mock import patch
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer

class TestSiteSuitability(unittest.TestCase):
    def setUp(self):
        self.analyzer = SiteSuitabilityAnalyzer()

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_biodiversity_no_intersection(self, mock_func, mock_session_local):
        # Setup mock session
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Mock query result to return None (no intersection)
        mock_session.query.return_value.filter.return_value.first.return_value = None

        result = self.analyzer._eval_biodiversity(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 100)
        self.assertEqual(result.data_source, "postgis")
        self.assertEqual(result.details["classification"], "None")

        # Verify session was closed
        mock_session.close.assert_called_once()

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_biodiversity_cba1(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Mock area
        mock_area = MagicMock()
        mock_area.area_type = "CBA 1"
        mock_area.category = "Test Category"
        mock_area.status = "Official"

        mock_session.query.return_value.filter.return_value.first.return_value = mock_area

        result = self.analyzer._eval_biodiversity(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 0)
        self.assertEqual(result.details["classification"], "Critical Biodiversity Area 1")
        self.assertIn("Critical Biodiversity Area 1", result.constraints)

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_biodiversity_cba2(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        mock_area = MagicMock()
        mock_area.area_type = "CBA 2"

        mock_session.query.return_value.filter.return_value.first.return_value = mock_area

        result = self.analyzer._eval_biodiversity(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 20)
        self.assertEqual(result.details["classification"], "Critical Biodiversity Area 2")

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_biodiversity_esa(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        mock_area = MagicMock()
        mock_area.area_type = "ESA"

        mock_session.query.return_value.filter.return_value.first.return_value = mock_area

        result = self.analyzer._eval_biodiversity(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 50)
        self.assertEqual(result.details["classification"], "Ecological Support Area")

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_biodiversity_other(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        mock_area = MagicMock()
        mock_area.area_type = "OTHER NATURAL AREA"

        mock_session.query.return_value.filter.return_value.first.return_value = mock_area

        result = self.analyzer._eval_biodiversity(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 70)
        self.assertEqual(result.details["classification"], "Other Natural Area")

    @patch("app.spatial_analysis.site_suitability.SessionLocal")
    @patch("app.spatial_analysis.site_suitability.func")
    def test_eval_biodiversity_db_error(self, mock_func, mock_session_local):
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session

        # Simulate DB error
        mock_session.query.side_effect = Exception("DB Connection Failed")

        result = self.analyzer._eval_biodiversity(-33.9249, 18.4241, "residential")

        self.assertEqual(result.score, 75)
        self.assertEqual(result.data_source, "error")
        self.assertIn("DB Connection Failed", result.details["note"])

        mock_session.close.assert_called_once()

    def test_eval_biodiversity_no_session_local(self):
        # Patch SessionLocal to be None
        with patch("app.spatial_analysis.site_suitability.SessionLocal", None):
            result = self.analyzer._eval_biodiversity(-33.9249, 18.4241, "residential")

            self.assertEqual(result.score, 75)
            self.assertEqual(result.data_source, "placeholder")

if __name__ == "__main__":
    unittest.main()
