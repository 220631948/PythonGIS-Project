import pytest
from unittest.mock import MagicMock, patch
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer, SuitabilityCriterion
from sqlalchemy import text

class TestSiteSuitabilityAnalyzer:

    @pytest.fixture
    def analyzer(self):
        return SiteSuitabilityAnalyzer()

    @patch("app.spatial_analysis.site_suitability.require_engine")
    def test_eval_urban_edge_inside(self, mock_require_engine, analyzer):
        # Mock database engine and connection
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Mock query result (True = inside urban edge)
        mock_result = MagicMock()
        mock_result.scalar.return_value = True
        mock_connection.execute.return_value = mock_result

        lat, lng = -33.92, 18.42
        result = analyzer._eval_urban_edge(lat, lng, "residential")

        # Verify SQL query execution
        assert mock_connection.execute.called
        args, kwargs = mock_connection.execute.call_args

        # Verify query text
        # Since text() returns a TextClause, we check its string representation
        assert "SELECT EXISTS" in str(args[0])
        assert "FROM urban_edge" in str(args[0])

        # Verify parameters (passed as second positional argument)
        assert args[1] == {"lng": lng, "lat": lat}

        # Verify result structure
        assert result.criterion == "urban_edge"
        assert result.score == 100
        assert result.details["within_urban_edge"] is True
        assert len(result.constraints) == 0
        assert result.data_source == "postgis"

    @patch("app.spatial_analysis.site_suitability.require_engine")
    def test_eval_urban_edge_outside(self, mock_require_engine, analyzer):
        # Mock database engine and connection
        mock_engine = MagicMock()
        mock_connection = MagicMock()
        mock_require_engine.return_value = mock_engine
        mock_engine.connect.return_value.__enter__.return_value = mock_connection

        # Mock query result (False = outside urban edge)
        mock_result = MagicMock()
        mock_result.scalar.return_value = False
        mock_connection.execute.return_value = mock_result

        lat, lng = -33.00, 18.00
        result = analyzer._eval_urban_edge(lat, lng, "residential")

        # Verify result structure
        assert result.criterion == "urban_edge"
        assert result.score == 0
        assert result.details["within_urban_edge"] is False
        assert "Outside Urban Edge" in result.constraints
        assert result.data_source == "postgis"

    @patch("app.spatial_analysis.site_suitability.require_engine")
    def test_eval_urban_edge_db_error(self, mock_require_engine, analyzer):
        # Mock database failure
        mock_require_engine.side_effect = Exception("DB Connection Failed")

        lat, lng = -33.92, 18.42
        result = analyzer._eval_urban_edge(lat, lng, "residential")

        # Verify fallback behavior
        assert result.criterion == "urban_edge"
        assert result.score == 80  # Default placeholder score
        assert result.details["within_urban_edge"] is None
        assert "Error: DB Connection Failed" in result.details["note"]
        assert result.data_source == "placeholder"
