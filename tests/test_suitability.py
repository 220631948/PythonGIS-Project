import pytest

from app.spatial_analysis.site_suitability import SiteSuitabilityAnalyzer


@pytest.fixture
def analyzer() -> SiteSuitabilityAnalyzer:
    return SiteSuitabilityAnalyzer()


def test_flood_risk_uses_postgis_intersection(analyzer: SiteSuitabilityAnalyzer, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(analyzer, "_resolve_table", lambda _candidates: "flood_zones")

    def fake_query(query: str, _params=None):
        if "MAX(risk_level)" in query:
            return {"overlap_count": 1, "risk_level": "high", "return_period": "1:100"}
        if "MIN(ST_Distance" in query:
            return {"distance_m": 15.0}
        return None

    monkeypatch.setattr(analyzer, "_run_query_one", fake_query)

    result = analyzer._eval_flood_risk(-33.9249, 18.4241, "residential")

    assert result.data_source == "postgis"
    assert result.score == 10
    assert result.details["in_flood_zone"] is True
    assert "flood risk zone" in " ".join(result.constraints).lower()


def test_wetlands_buffer_constraint_when_too_close(
    analyzer: SiteSuitabilityAnalyzer, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(analyzer, "_resolve_table", lambda _candidates: "wetlands")

    def fake_query(query: str, _params=None):
        if "COUNT(*)::int AS overlap_count" in query:
            return {"overlap_count": 0}
        if "MIN(ST_Distance" in query:
            return {"distance_m": 20.0}
        return None

    monkeypatch.setattr(analyzer, "_run_query_one", fake_query)

    result = analyzer._eval_wetlands(-33.9249, 18.4241, "residential")

    assert result.data_source == "postgis"
    assert result.details["in_wetland"] is False
    assert result.details["buffer_distance_m"] == 20.0
    assert result.score < 90
    assert any("buffer" in c.lower() for c in result.constraints)


@pytest.mark.parametrize(
    "zone_label,development_type,expected_score,rezoning_required,has_constraints",
    [
        ("General Residential", "residential", 90, False, False),
        ("General Industrial", "residential", 30, True, True),
    ],
)
def test_zoning_compatibility_scoring(
    analyzer: SiteSuitabilityAnalyzer,
    monkeypatch: pytest.MonkeyPatch,
    zone_label: str,
    development_type: str,
    expected_score: int,
    rezoning_required: bool,
    has_constraints: bool,
):
    monkeypatch.setattr(analyzer, "_resolve_table", lambda _candidates: "zoning_areas")
    monkeypatch.setattr(analyzer, "_run_query_one", lambda _query, _params=None: {"zoning": zone_label})

    result = analyzer._eval_zoning(-33.9249, 18.4241, development_type)

    assert result.data_source == "postgis"
    assert result.score == expected_score
    assert result.details["rezoning_required"] == rezoning_required
    assert bool(result.constraints) is has_constraints


def test_transport_access_falls_back_when_table_missing(
    analyzer: SiteSuitabilityAnalyzer, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(analyzer, "_resolve_table", lambda _candidates: None)

    result = analyzer._eval_transport_access(-33.9249, 18.4241, "residential")

    assert result.data_source == "placeholder"
    assert "note" in result.details
