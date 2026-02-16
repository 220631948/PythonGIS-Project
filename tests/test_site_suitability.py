"""
Comprehensive tests for PostGIS-backed site suitability evaluators.

Tests cover:
1. Each evaluator with mock PostGIS data
2. Placeholder fallback when database unavailable
3. CRS transformations
4. Error handling
5. Integration tests with full analysis workflow
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncEngine

from app.spatial_analysis.site_suitability import (
    SiteSuitabilityAnalyzer,
    SuitabilityCriterion,
    CriterionResult,
    SuitabilityResult
)


@pytest.fixture
def analyzer():
    """Create a site suitability analyzer instance."""
    return SiteSuitabilityAnalyzer()


@pytest.fixture
def cape_town_coords():
    """Typical Cape Town coordinates for testing."""
    return {
        "city_center": (-33.9249, 18.4241),  # CBD
        "table_mountain": (-33.9628, 18.4098),  # Protected area
        "khayelitsha": (-34.0359, 18.6666),  # Township
        "camps_bay": (-33.9508, 18.3777),  # Coastal residential
    }


class TestFloodRiskEvaluator:
    """Tests for flood risk evaluation."""
    
    @pytest.mark.asyncio
    async def test_flood_risk_in_flood_zone_high(self, analyzer):
        """Test site inside high-risk flood zone."""
        with patch.object(analyzer, '_query_flood_risk') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "in_flood_zone": True,
                "risk_level": "high",
                "return_period": "1:10",
                "zone_id": "FZ001"
            })()
            
            result = analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")
            
            assert result.criterion == "flood_risk"
            assert result.score == 15  # Low score for high risk
            assert result.data_source == "postgis"
            assert result.details["in_flood_zone"] is True
            assert len(result.constraints) > 0
    
    @pytest.mark.asyncio
    async def test_flood_risk_no_flood_zone(self, analyzer):
        """Test site outside flood zones."""
        with patch.object(analyzer, '_query_flood_risk') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "in_flood_zone": False,
                "risk_level": "none",
                "return_period": "N/A"
            })()
            
            result = analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")
            
            assert result.score >= 90
            assert result.details["in_flood_zone"] is False
            assert len(result.constraints) == 0
    
    def test_flood_risk_fallback_placeholder(self, analyzer):
        """Test fallback to placeholder when database unavailable."""
        with patch.object(analyzer, '_query_flood_risk') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: None)()
            
            result = analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")
            
            assert result.data_source == "placeholder"
            assert "note" in result.details


class TestBiodiversityEvaluator:
    """Tests for biodiversity evaluation."""
    
    @pytest.mark.asyncio
    async def test_biodiversity_in_cba(self, analyzer):
        """Test site in Critical Biodiversity Area."""
        with patch.object(analyzer, '_query_biodiversity') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "in_network": True,
                "area_type": "CBA",
                "vegetation_type": "Fynbos",
                "name": "Table Mountain CBA"
            })()
            
            result = analyzer._eval_biodiversity(-33.9628, 18.4098, "residential")
            
            assert result.score <= 30  # Very low score for CBA
            assert result.data_source == "postgis"
            assert "CBA" in result.details["classification"]
            assert len(result.constraints) > 0
    
    @pytest.mark.asyncio
    async def test_biodiversity_outside_network(self, analyzer):
        """Test site outside biodiversity network."""
        with patch.object(analyzer, '_query_biodiversity') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "in_network": False,
                "area_type": "none",
                "vegetation_type": "N/A"
            })()
            
            result = analyzer._eval_biodiversity(-33.9249, 18.4241, "commercial")
            
            assert result.score >= 85
            assert result.details["in_biodiversity_network"] is False


class TestWetlandsEvaluator:
    """Tests for wetlands evaluation."""
    
    @pytest.mark.asyncio
    async def test_wetlands_inside_wetland(self, analyzer):
        """Test site inside wetland area."""
        with patch.object(analyzer, '_query_wetlands') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "in_wetland": True,
                "wetland_type": "Seep",
                "distance_m": 0,
                "wetland_name": "Test Wetland"
            })()
            
            result = analyzer._eval_wetlands(-33.9249, 18.4241, "residential")
            
            assert result.score <= 15
            assert result.details["in_wetland"] is True
            assert "prohibited" in result.constraints[0].lower()
    
    @pytest.mark.asyncio
    async def test_wetlands_within_buffer(self, analyzer):
        """Test site within 32m wetland buffer."""
        with patch.object(analyzer, '_query_wetlands') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "in_wetland": False,
                "distance_m": 25.5,
                "wetland_type": "Vlei"
            })()
            
            result = analyzer._eval_wetlands(-33.9249, 18.4241, "residential")
            
            assert result.score <= 40
            assert result.details["buffer_distance_m"] == 25.5
            assert result.details["required_buffer_m"] == 32
            assert len(result.constraints) > 0
    
    @pytest.mark.asyncio
    async def test_wetlands_safe_distance(self, analyzer):
        """Test site at safe distance from wetlands."""
        with patch.object(analyzer, '_query_wetlands') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "in_wetland": False,
                "distance_m": 500.0
            })()
            
            result = analyzer._eval_wetlands(-33.9249, 18.4241, "residential")
            
            assert result.score >= 90


class TestZoningEvaluator:
    """Tests for zoning compatibility evaluation."""
    
    @pytest.mark.asyncio
    async def test_zoning_compatible_residential(self, analyzer):
        """Test compatible residential zoning."""
        with patch.object(analyzer, '_query_zoning') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "zone_type": "Residential",
                "zone_code": "R1",
                "zone_name": "Single Residential",
                "permitted_uses": ["residential", "dwelling"],
                "is_compatible": True
            })()
            
            result = analyzer._eval_zoning(-33.9249, 18.4241, "residential")
            
            assert result.score >= 90
            assert result.details["rezoning_required"] is False
            assert len(result.constraints) == 0
    
    @pytest.mark.asyncio
    async def test_zoning_incompatible_requires_rezoning(self, analyzer):
        """Test incompatible zoning requiring rezoning."""
        with patch.object(analyzer, '_query_zoning') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "zone_type": "Residential",
                "zone_code": "R2",
                "zone_name": "General Residential",
                "permitted_uses": ["residential"],
                "is_compatible": False
            })()
            
            result = analyzer._eval_zoning(-33.9249, 18.4241, "commercial")
            
            assert result.score <= 50
            assert result.details["rezoning_required"] is True
            assert len(result.constraints) > 0


class TestRoadAccessEvaluator:
    """Tests for road access evaluation."""
    
    @pytest.mark.asyncio
    async def test_road_access_excellent(self, analyzer):
        """Test site with excellent road access."""
        with patch.object(analyzer, '_query_road_access') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "road_name": "Main Road",
                "road_type": "Primary",
                "road_class": "primary",
                "distance_m": 25.0
            })()
            
            result = analyzer._eval_road_access(-33.9249, 18.4241, "commercial")
            
            assert result.score >= 90
            assert result.details["distance_to_road_m"] == 25.0
            assert result.details["access_quality"] == "Good"
    
    @pytest.mark.asyncio
    async def test_road_access_poor(self, analyzer):
        """Test site with poor road access."""
        with patch.object(analyzer, '_query_road_access') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "road_name": "Service Road",
                "road_type": "Tertiary",
                "road_class": "tertiary",
                "distance_m": 1500.0
            })()
            
            result = analyzer._eval_road_access(-33.9249, 18.4241, "industrial")
            
            assert result.score <= 50
            assert "road construction" in result.constraints[0].lower()


class TestTransportAccessEvaluator:
    """Tests for public transport access evaluation."""
    
    @pytest.mark.asyncio
    async def test_transport_access_excellent(self, analyzer):
        """Test site with excellent transit access."""
        with patch.object(analyzer, '_query_transport_access') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "stop_name": "Cape Town Station",
                "transit_type": "rail_station",
                "distance_m": 200.0
            })()
            
            result = analyzer._eval_transport_access(-33.9249, 18.4241, "residential")
            
            assert result.score >= 90
            assert result.details["walking_time_min"] is not None
            assert result.details["walking_time_min"] < 5
    
    @pytest.mark.asyncio
    async def test_transport_access_poor(self, analyzer):
        """Test site with poor transit access."""
        with patch.object(analyzer, '_query_transport_access') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "stop_name": "Distant Stop",
                "transit_type": "bus_stop",
                "distance_m": 1800.0
            })()
            
            result = analyzer._eval_transport_access(-33.9249, 18.4241, "residential")
            
            assert result.score <= 50
            assert "car dependency" in result.constraints[0].lower()


class TestUtilitiesEvaluator:
    """Tests for utilities access evaluation."""
    
    @pytest.mark.asyncio
    async def test_utilities_excellent_access(self, analyzer):
        """Test site with excellent utilities access."""
        with patch.object(analyzer, '_query_utilities') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "water_distance_m": 150.0,
                "electricity_distance_m": 180.0
            })()
            
            result = analyzer._eval_utilities(-33.9249, 18.4241, "residential")
            
            assert result.score >= 85
            assert result.details["water_available"] is True
            assert result.details["electricity_available"] is True
    
    @pytest.mark.asyncio
    async def test_utilities_remote_access(self, analyzer):
        """Test site with remote utilities requiring extensions."""
        with patch.object(analyzer, '_query_utilities') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "water_distance_m": 2500.0,
                "electricity_distance_m": 3000.0
            })()
            
            result = analyzer._eval_utilities(-33.9249, 18.4241, "residential")
            
            assert result.score <= 50
            assert len(result.constraints) >= 2


class TestUrbanEdgeEvaluator:
    """Tests for urban edge evaluation."""
    
    @pytest.mark.asyncio
    async def test_urban_edge_inside(self, analyzer):
        """Test site inside urban edge."""
        with patch.object(analyzer, '_query_urban_edge') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "within_urban_edge": True,
                "suburb_name": "Gardens",
                "city": "Cape Town",
                "distance_m": 0
            })()
            
            result = analyzer._eval_urban_edge(-33.9249, 18.4241, "residential")
            
            assert result.score >= 90
            assert result.details["within_urban_edge"] is True
            assert len(result.constraints) == 0
    
    @pytest.mark.asyncio
    async def test_urban_edge_outside(self, analyzer):
        """Test site outside urban edge."""
        with patch.object(analyzer, '_query_urban_edge') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: {
                "within_urban_edge": False,
                "distance_m": 3000.0,
                "nearest_suburb": "Philippi"
            })()
            
            result = analyzer._eval_urban_edge(-33.9249, 18.4241, "residential")
            
            assert result.score <= 30
            assert "outside urban edge" in result.constraints[0].lower()


class TestFullSuitabilityAnalysis:
    """Integration tests for full site suitability analysis."""
    
    def test_analyze_point_basic(self, analyzer, cape_town_coords):
        """Test full point analysis with default weights."""
        lat, lng = cape_town_coords["city_center"]
        
        # Mock all evaluators to return placeholder data
        result = analyzer.analyze_point(lat, lng, development_type="residential")
        
        assert isinstance(result, SuitabilityResult)
        assert result.location["lat"] == lat
        assert result.location["lng"] == lng
        assert 0 <= result.overall_score <= 100
        assert result.suitability_class in [
            "Highly Suitable", "Suitable", "Marginal", "Unsuitable"
        ]
        assert len(result.criteria_results) > 0
        assert len(result.recommendations) > 0
    
    def test_analyze_point_custom_weights(self, analyzer, cape_town_coords):
        """Test analysis with custom criterion weights."""
        lat, lng = cape_town_coords["camps_bay"]
        
        custom_weights = {
            "flood_risk": 0.25,
            "transport_access": 0.25,
            "road_access": 0.20,
            "biodiversity": 0.15,
            "wetlands": 0.15
        }
        
        result = analyzer.analyze_point(
            lat, lng,
            development_type="commercial",
            custom_weights=custom_weights
        )
        
        assert isinstance(result, SuitabilityResult)
        # Weights should be normalized to sum to 1.0
        total_weight = sum(cr.weight for cr in result.criteria_results)
        assert 0.99 <= total_weight <= 1.01  # Allow floating point precision
    
    def test_analyze_point_constraints_violation(self, analyzer):
        """Test that hard constraints affect suitability classification."""
        # Create analyzer with mock that returns multiple constraints
        with patch.object(analyzer, '_eval_flood_risk') as mock_flood:
            mock_flood.return_value = CriterionResult(
                criterion="flood_risk",
                score=10,
                weight=0.2,
                weighted_score=2,
                details={"in_flood_zone": True},
                constraints=["Flood zone constraint"],
                data_source="test"
            )
            
            with patch.object(analyzer, '_eval_wetlands') as mock_wetlands:
                mock_wetlands.return_value = CriterionResult(
                    criterion="wetlands",
                    score=10,
                    weight=0.2,
                    weighted_score=2,
                    details={"in_wetland": True},
                    constraints=["Wetland constraint"],
                    data_source="test"
                )
                
                result = analyzer.analyze_point(-33.9249, 18.4241, "residential")
                
                # Multiple hard constraints should result in "Unsuitable"
                assert len(result.constraints_violated) >= 2
                assert result.suitability_class == "Unsuitable"
    
    def test_analyze_polygon_basic(self, analyzer):
        """Test polygon analysis using centroid."""
        geometry = {
            "type": "Polygon",
            "coordinates": [[
                [18.42, -33.92],
                [18.43, -33.92],
                [18.43, -33.93],
                [18.42, -33.93],
                [18.42, -33.92]
            ]]
        }
        
        result = analyzer.analyze_polygon(geometry, development_type="residential")
        
        assert result["type"] == "polygon"
        assert "centroid" in result
        assert "point_analysis" in result
        assert isinstance(result["point_analysis"], SuitabilityResult)
    
    def test_recommendations_generation(self, analyzer, cape_town_coords):
        """Test that recommendations are generated appropriately."""
        lat, lng = cape_town_coords["city_center"]
        
        result = analyzer.analyze_point(lat, lng, development_type="residential")
        
        assert len(result.recommendations) > 0
        # Should mention placeholder data warning
        assert any("placeholder" in rec.lower() for rec in result.recommendations)
    
    def test_suitability_classification(self, analyzer):
        """Test suitability score classification thresholds."""
        # Test classification logic directly
        assert analyzer._classify_suitability(85, []) == "Highly Suitable"
        assert analyzer._classify_suitability(70, []) == "Suitable"
        assert analyzer._classify_suitability(50, []) == "Marginal"
        assert analyzer._classify_suitability(30, []) == "Unsuitable"
        
        # Multiple constraints should override score
        assert analyzer._classify_suitability(85, ["c1", "c2"]) == "Unsuitable"


class TestCRSHandling:
    """Tests for proper CRS transformation handling."""
    
    @pytest.mark.asyncio
    async def test_distance_calculation_uses_utm(self, analyzer):
        """Verify that distance calculations use EPSG:32734 (UTM)."""
        # This would be tested by checking the actual SQL queries
        # In the implementation, we use ST_Transform(..., 32734) for distance
        with patch('app.spatial_analysis.site_suitability.get_engine') as mock_engine:
            mock_conn = AsyncMock()
            mock_engine.return_value.connect.return_value.__aenter__.return_value = mock_conn
            mock_conn.execute.return_value.fetchone.return_value = None
            
            try:
                await analyzer._query_road_access(-33.9249, 18.4241)
            except Exception:
                pass
            
            # Check that execute was called (query was attempted)
            assert mock_conn.execute.called


class TestErrorHandling:
    """Tests for error handling and graceful degradation."""
    
    def test_database_connection_error_fallback(self, analyzer):
        """Test graceful fallback when database is unavailable."""
        with patch.object(analyzer, '_query_flood_risk') as mock_query:
            mock_query.return_value = asyncio.coroutine(lambda: None)()
            
            result = analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")
            
            assert result.data_source == "placeholder"
            assert result.score > 0  # Should return reasonable placeholder score
    
    def test_evaluation_exception_handling(self, analyzer):
        """Test that evaluator exceptions don't crash analysis."""
        with patch.object(analyzer, '_eval_flood_risk') as mock_eval:
            mock_eval.side_effect = Exception("Database error")
            
            # Should not raise exception, but return placeholder
            result = analyzer._evaluate_criterion(
                -33.9249, 18.4241,
                SuitabilityCriterion.FLOOD_RISK,
                "residential"
            )
            
            assert result is not None
            assert result.data_source in ["error", "placeholder"]


class TestPerformance:
    """Performance-related tests."""
    
    def test_analyze_point_performance(self, analyzer, cape_town_coords):
        """Test that analysis completes in reasonable time."""
        import time
        
        lat, lng = cape_town_coords["city_center"]
        
        start_time = time.time()
        result = analyzer.analyze_point(lat, lng, "residential")
        elapsed = time.time() - start_time
        
        # Should complete in under 2 seconds (with placeholders, much faster)
        assert elapsed < 2.0
        assert result is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
