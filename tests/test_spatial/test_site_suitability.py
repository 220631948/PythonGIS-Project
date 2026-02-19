import pytest
from unittest.mock import MagicMock, patch
from app.spatial_analysis.site_suitability import (
    SiteSuitabilityAnalyzer,
    SuitabilityCriterion,
    CriterionResult
)
import logging

class TestSiteSuitabilityAnalyzer:

    def test_evaluate_criterion_error_handling(self, caplog):
        """Test that evaluator exceptions are caught and handled gracefully."""
        analyzer = SiteSuitabilityAnalyzer()

        # We'll mock the _eval_flood_risk method to raise an exception
        # We need to patch it on the instance

        with patch.object(analyzer, '_eval_flood_risk', side_effect=Exception("Database connection failed")):
            with caplog.at_level(logging.WARNING):
                result = analyzer._evaluate_criterion(
                    lat=-33.92,
                    lng=18.42,
                    criterion=SuitabilityCriterion.FLOOD_RISK,
                    development_type="residential"
                )

            # Assertions
            assert result.criterion == SuitabilityCriterion.FLOOD_RISK.value
            assert result.data_source == "error"
            assert result.details["error"] == "Database connection failed"
            # The score should be the default one (50)
            assert result.score == 50

            # Verify the log message
            assert "Criterion flood_risk evaluation failed: Database connection failed" in caplog.text

    def test_analyze_point_with_error(self):
        """Test that analyze_point handles errors in one criterion without failing completely."""
        analyzer = SiteSuitabilityAnalyzer()

        # We only want to patch it for this specific call context
        with patch.object(analyzer, '_eval_flood_risk', side_effect=Exception("Simulated failure")):
            result = analyzer.analyze_point(
                lat=-33.92,
                lng=18.42,
                development_type="residential"
            )

            # Find the flood risk result
            flood_result = next(r for r in result.criteria_results if r.criterion == "flood_risk")

            assert flood_result.data_source == "error"
            assert "Simulated failure" in flood_result.details["error"]

            # Other results should be fine (placeholder)
            biodiversity_result = next(r for r in result.criteria_results if r.criterion == "biodiversity")
            assert biodiversity_result.data_source == "placeholder"
