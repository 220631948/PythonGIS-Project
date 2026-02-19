"""
Tests for Site Suitability Analysis Module
"""
import pytest
from unittest.mock import Mock, patch, ANY
from app.spatial_analysis.site_suitability import (
    SiteSuitabilityAnalyzer,
    SuitabilityCriterion,
    CriterionResult,
    SuitabilityResult,
    DEFAULT_WEIGHTS,
    SUITABILITY_THRESHOLDS
)

@pytest.fixture
def analyzer():
    return SiteSuitabilityAnalyzer()

def test_initialization():
    """Test that the analyzer initializes with default weights."""
    analyzer = SiteSuitabilityAnalyzer()
    assert analyzer.weights == DEFAULT_WEIGHTS

def test_initialization_custom_weights():
    """Test that the analyzer initializes with custom weights."""
    custom_weights = {SuitabilityCriterion.FLOOD_RISK: 0.5}
    analyzer = SiteSuitabilityAnalyzer(weights=custom_weights)
    assert analyzer.weights == custom_weights

def test_analyze_point_calculation(analyzer):
    """
    Test analyze_point with mocked criteria evaluation.
    Verify that scores are weighted and summed correctly.
    """
    # Create a mock for _evaluate_criterion
    # We want it to return a CriterionResult with a fixed score of 100 for all criteria
    # This should result in an overall score of 100 (since weights sum to 1)

    with patch.object(analyzer, '_evaluate_criterion') as mock_eval:
        def side_effect(lat, lng, criterion, dev_type):
            return CriterionResult(
                criterion=criterion.value,
                score=100.0,
                weight=0.0,  # Will be set by analyze_point
                weighted_score=0.0,  # Will be set by analyze_point
                details={},
                constraints=[],
                data_source="mock"
            )
        mock_eval.side_effect = side_effect

        result = analyzer.analyze_point(
            lat=-33.92,
            lng=18.42,
            development_type="residential"
        )

        assert isinstance(result, SuitabilityResult)
        assert result.overall_score == 100.0
        assert result.suitability_class == "Highly Suitable"
        assert len(result.criteria_results) == len(DEFAULT_WEIGHTS)

def test_analyze_point_custom_weights(analyzer):
    """
    Test analyze_point with custom weights passed to the method.
    Verify weights are normalized and affect the calculation.
    """
    # Custom weights override specific keys but keep others from defaults.
    # Original Defaults sum to 1.0.
    # We set FLOOD_RISK=0.5, BIODIVERSITY=0.5.
    # Original FLOOD_RISK=0.15, BIODIVERSITY=0.15.
    # New sum = 1.0 - 0.30 + 1.0 = 1.7.
    # Normalization factor = 1/1.7.

    custom_weights = {
        "flood_risk": 0.5,
        "biodiversity": 0.5
    }

    with patch.object(analyzer, '_evaluate_criterion') as mock_eval:
        def side_effect(lat, lng, criterion, dev_type):
            score = 0.0
            if criterion == SuitabilityCriterion.BIODIVERSITY:
                score = 100.0
            elif criterion == SuitabilityCriterion.FLOOD_RISK:
                score = 0.0
            else:
                score = 50.0 # Default for others

            return CriterionResult(
                criterion=criterion.value,
                score=score,
                weight=0.0,
                weighted_score=0.0,
                details={},
                constraints=[],
                data_source="mock"
            )
        mock_eval.side_effect = side_effect

        result = analyzer.analyze_point(
            lat=-33.92,
            lng=18.42,
            development_type="residential",
            custom_weights=custom_weights
        )

        # Verify that all default criteria are present
        assert len(result.criteria_results) == len(DEFAULT_WEIGHTS)

        # Verify weights were updated and normalized
        flood_result = next(r for r in result.criteria_results if r.criterion == "flood_risk")
        bio_result = next(r for r in result.criteria_results if r.criterion == "biodiversity")

        # Expected normalized weight: 0.5 / 1.7 ~= 0.2941
        expected_weight = 0.5 / 1.7
        assert abs(flood_result.weight - expected_weight) < 0.001
        assert abs(bio_result.weight - expected_weight) < 0.001

        # Verify score calculation
        # Sum of (score * weight)
        # Flood: 0 * 0.2941 = 0
        # Bio: 100 * 0.2941 = 29.41
        # Others (sum of rest of weights = 0.7/1.7 = 0.4117) * 50 = 20.58
        # Total approx 50.0

        assert abs(result.overall_score - 50.0) < 1.0

def test_analyze_point_constraints(analyzer):
    """
    Test that constraints affect the suitability class.
    If >= 2 constraints are violated, class should be "Unsuitable".
    """
    with patch.object(analyzer, '_evaluate_criterion') as mock_eval:
        def side_effect(lat, lng, criterion, dev_type):
            # Return a high score but with a constraint
            return CriterionResult(
                criterion=criterion.value,
                score=100.0,
                weight=0.0,
                weighted_score=0.0,
                details={},
                constraints=["Some Constraint"],
                data_source="mock"
            )
        mock_eval.side_effect = side_effect

        result = analyzer.analyze_point(
            lat=-33.92,
            lng=18.42
        )

        # All default weights criteria will be evaluated (9 criteria).
        # Each returns 1 constraint. Total constraints = 9.
        # Should be Unsuitable despite score 100.
        assert len(result.constraints_violated) >= 2
        assert result.suitability_class == "Unsuitable"
        assert result.overall_score == 100.0 # Score calculation doesn't care about constraints

def test_analyze_point_placeholder_warnings(analyzer):
    """
    Test that recommendations include warnings about placeholder data
    when using the real _evaluate_criterion (which returns placeholders).
    """
    # No mocking here, use the real methods which return placeholders
    result = analyzer.analyze_point(
        lat=-33.92,
        lng=18.42
    )

    has_warning = any("placeholder data" in r for r in result.recommendations)
    assert has_warning, "Should warn about placeholder data"

    # Also verify basic structure with real (placeholder) data
    assert result.overall_score > 0
    assert result.suitability_class in SUITABILITY_THRESHOLDS.keys()

def test_analyze_polygon_simple(analyzer):
    """Test analyze_polygon with valid polygon geometry."""

    polygon_geojson = {
        "type": "Polygon",
        "coordinates": [[
            [18.41, -33.92],
            [18.43, -33.92],
            [18.43, -33.93],
            [18.41, -33.93],
            [18.41, -33.92]
        ]]
    }

    # We mock analyze_point to verify it's called with centroid
    with patch.object(analyzer, 'analyze_point') as mock_analyze_point:
        mock_analyze_point.return_value = SuitabilityResult(
            location={"lat": -33.925, "lng": 18.42},
            overall_score=80.0,
            suitability_class="Highly Suitable",
            criteria_results=[],
            constraints_violated=[],
            recommendations=[]
        )

        result = analyzer.analyze_polygon(polygon_geojson)

        assert result["type"] == "polygon"
        assert "centroid" in result

        # Check centroid calculation
        # Lats: -33.92, -33.92, -33.93, -33.93, -33.92. Avg approx -33.924
        # Lngs: 18.41, 18.43, 18.43, 18.41, 18.41. Avg approx 18.418

        centroid = result["centroid"]
        assert -33.93 <= centroid["lat"] <= -33.92
        assert 18.41 <= centroid["lng"] <= 18.43

        # Verify analyze_point was called
        mock_analyze_point.assert_called_once()
        call_args = mock_analyze_point.call_args
        assert call_args[0][0] == centroid["lat"]
        assert call_args[0][1] == centroid["lng"]

def test_analyze_polygon_invalid(analyzer):
    """Test analyze_polygon with invalid geometry type."""
    invalid_geojson = {
        "type": "Point", # Not a Polygon
        "coordinates": [18.42, -33.92]
    }

    result = analyzer.analyze_polygon(invalid_geojson)
    assert "error" in result
    assert result["error"] == "Invalid geometry type"
