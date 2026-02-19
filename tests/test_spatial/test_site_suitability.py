import pytest
import logging
from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer, SuitabilityCriterion, SuitabilityResult

def test_analyze_point_with_invalid_custom_weights(caplog):
    """
    Test analyze_point handles invalid custom weights gracefully.
    """
    analyzer = SiteSuitabilityAnalyzer()

    # Define custom weights with one valid and one invalid key
    custom_weights = {
        "flood_risk": 0.5,
        "invalid_criterion_key": 0.5
    }

    with caplog.at_level(logging.WARNING):
        result = analyzer.analyze_point(
            lat=-33.9249,
            lng=18.4241,
            development_type="residential",
            custom_weights=custom_weights
        )

    # Assert that a warning was logged for the invalid key
    assert "Unknown criterion: invalid_criterion_key" in caplog.text

    # Assert that the result is a valid SuitabilityResult object
    assert isinstance(result, SuitabilityResult)

    # Verify valid weights were applied (normalized)
    # The default weights sum to 1.0. With custom weights, flood_risk becomes 0.5.
    # New sum = 1.0 - 0.15 + 0.5 = 1.35
    # Normalized flood_risk = 0.5 / 1.35 ≈ 0.37037

    flood_risk_result = next(r for r in result.criteria_results if r.criterion == "flood_risk")

    # Default weights are defined in SiteSuitabilityAnalyzer
    # flood_risk default is 0.15
    # The analyzer copies default weights, updates with custom weights, then normalizes.
    # sum(DEFAULT_WEIGHTS) is 1.0 (assuming implementation is correct)
    # The custom weight update replaces the existing weight.

    # Let's verify the calculation logic:
    # 1. Start with defaults (sum=1.0)
    # 2. Replace flood_risk (0.15) with 0.5. New sum = 1.0 - 0.15 + 0.5 = 1.35
    # 3. Normalize: weight = val / sum
    expected_weight = 0.5 / 1.35

    assert abs(flood_risk_result.weight - expected_weight) < 1e-4

def test_analyze_point_basic():
    """Test basic functionality of analyze_point."""
    analyzer = SiteSuitabilityAnalyzer()
    result = analyzer.analyze_point(-33.9249, 18.4241, "residential")

    assert isinstance(result, SuitabilityResult)
    assert result.overall_score >= 0
    assert result.overall_score <= 100
    assert len(result.criteria_results) > 0
    assert result.location["lat"] == -33.9249
    assert result.location["lng"] == 18.4241
