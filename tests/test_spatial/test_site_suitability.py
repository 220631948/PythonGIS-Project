import pytest
from unittest.mock import MagicMock, patch
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer

class TestFloodRiskEvaluation:
    @pytest.fixture
    def analyzer(self):
        return SiteSuitabilityAnalyzer()

    def test_flood_risk_found(self, analyzer):
        """Test evaluation when location is in a flood zone."""
        lat, lng = -33.92, 18.42

        # Mock engine and connection
        mock_engine = MagicMock()
        mock_conn = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn

        # Mock query result (scalar() returns 1)
        mock_conn.execute.return_value.scalar.return_value = 1

        with patch("app.spatial_analysis.site_suitability.require_engine", return_value=mock_engine), \
             patch("app.spatial_analysis.site_suitability.text", side_effect=lambda x: x):
            result = analyzer._eval_flood_risk(lat, lng, "residential")

            assert result.criterion == "flood_risk"
            assert result.score == 10
            assert result.details["in_flood_zone"] is True
            assert result.details["risk_level"] == "high"
            assert "High Flood Risk" in result.constraints
            assert result.data_source == "postgis"

            # Verify query structure
            mock_conn.execute.assert_called_once()
            args, kwargs = mock_conn.execute.call_args
            query_str = str(args[0])
            assert "SELECT 1 FROM flood_zones" in query_str
            assert "ST_Intersects" in query_str
            # Check bind parameters (passed as second positional argument)
            assert args[1] == {"lng": lng, "lat": lat}

    def test_flood_risk_not_found(self, analyzer):
        """Test evaluation when location is NOT in a flood zone."""
        lat, lng = -33.92, 18.42

        # Mock engine and connection
        mock_engine = MagicMock()
        mock_conn = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn

        # Mock query result (scalar() returns None)
        mock_conn.execute.return_value.scalar.return_value = None

        with patch("app.spatial_analysis.site_suitability.require_engine", return_value=mock_engine):
            result = analyzer._eval_flood_risk(lat, lng, "residential")

            assert result.criterion == "flood_risk"
            assert result.score == 90
            assert result.details["in_flood_zone"] is False
            assert result.details["risk_level"] == "low"
            assert len(result.constraints) == 0
            assert result.data_source == "postgis"

    def test_database_error(self, analyzer):
        """Test fallback when database connection fails."""
        lat, lng = -33.92, 18.42

        with patch("app.spatial_analysis.site_suitability.require_engine", side_effect=Exception("DB Error")):
            result = analyzer._eval_flood_risk(lat, lng, "residential")

            assert result.criterion == "flood_risk"
            assert result.score == 50
            assert result.details["risk_level"] == "unknown"
            assert result.details["error"] == "DB Error"
            assert result.data_source == "error"
