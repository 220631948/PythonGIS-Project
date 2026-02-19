import pytest
from unittest.mock import MagicMock, patch
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer, SuitabilityCriterion

def test_calculate_zoning_score():
    analyzer = SiteSuitabilityAnalyzer()

    # Test Residential compatibility
    score, notes = analyzer._calculate_zoning_score("SR1", "Single Residential 1", "residential")
    assert score == 100.0
    assert "Compatible" in notes

    score, notes = analyzer._calculate_zoning_score("GB1", "General Business 1", "residential")
    assert score == 80.0
    assert "Generally compatible" in notes

    score, notes = analyzer._calculate_zoning_score("GI1", "General Industrial 1", "residential")
    assert score == 20.0
    assert "Incompatible" in notes

    # Test Commercial compatibility
    score, notes = analyzer._calculate_zoning_score("GB1", "General Business 1", "commercial")
    assert score == 100.0

    score, notes = analyzer._calculate_zoning_score("SR1", "Single Residential 1", "commercial")
    assert score == 20.0

    # Test Industrial compatibility
    score, notes = analyzer._calculate_zoning_score("GI1", "General Industrial 1", "industrial")
    assert score == 100.0

    score, notes = analyzer._calculate_zoning_score("SR1", "Single Residential 1", "industrial")
    assert score == 10.0

@patch("app.spatial_analysis.site_suitability.require_engine")
def test_eval_zoning_success(mock_require_engine):
    # Setup mock engine and connection
    mock_engine = MagicMock()
    mock_require_engine.return_value = mock_engine
    mock_conn = mock_engine.connect.return_value.__enter__.return_value

    # Mock database result
    mock_result = MagicMock()
    mock_result.fetchone.return_value = ("General Residential 1", "GR1", {})
    mock_conn.execute.return_value = mock_result

    analyzer = SiteSuitabilityAnalyzer()
    result = analyzer._eval_zoning(-33.9249, 18.4241, "residential")

    assert result.criterion == "zoning_compatible"
    assert result.score == 100.0
    assert result.data_source == "postgis"
    assert result.details["current_zoning"] == "General Residential 1"
    assert result.details["zone_type"] == "GR1"

@patch("app.spatial_analysis.site_suitability.require_engine")
def test_eval_zoning_no_result(mock_require_engine):
    # Setup mock engine and connection
    mock_engine = MagicMock()
    mock_require_engine.return_value = mock_engine
    mock_conn = mock_engine.connect.return_value.__enter__.return_value

    # Mock no database result
    mock_result = MagicMock()
    mock_result.fetchone.return_value = None
    mock_conn.execute.return_value = mock_result

    analyzer = SiteSuitabilityAnalyzer()
    result = analyzer._eval_zoning(-33.9249, 18.4241, "residential")

    # Should fallback to placeholder
    assert result.data_source == "placeholder"
    assert result.score == 70.0
    assert result.details["current_zoning"] == "Unknown"

@patch("app.spatial_analysis.site_suitability.require_engine")
def test_eval_zoning_db_error(mock_require_engine):
    # Setup mock engine to raise error
    mock_require_engine.side_effect = Exception("DB Connection Error")

    analyzer = SiteSuitabilityAnalyzer()
    result = analyzer._eval_zoning(-33.9249, 18.4241, "residential")

    # Should fallback to placeholder
    assert result.data_source == "placeholder"
    assert result.score == 70.0
