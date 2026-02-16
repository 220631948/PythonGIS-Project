
import pytest
import json
from unittest.mock import MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import get_db

@pytest.mark.anyio
async def test_get_nearby_features_optimized():
    """
    Test that get_nearby_features uses optimized PostGIS JSON generation
    and handles async DB session correctly.
    """

    # Mock result from DB (simulating json_build_object output)
    mock_json_result = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [18.42, -33.92]},
                "properties": {"id": 1, "name": "Test Feature", "distance_meters": 10.0}
            }
        ]
    }

    # Mock AsyncSession
    mock_session = AsyncMock()

    # Mock Result object (returned by await session.execute(...))
    mock_result = MagicMock()
    mock_result.scalar.return_value = json.dumps(mock_json_result)

    # session.execute(...) returns a coroutine that yields Result
    mock_session.execute.return_value = mock_result

    # Override get_db dependency
    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/spatial/nearby?layer=schools&lat=-33.92&lon=18.42")

        # Verify response
        assert response.status_code == 200
        assert response.json() == mock_json_result

        # Verify SQL query structure
        # The query is the first argument to execute
        args, kwargs = mock_session.execute.call_args
        query_obj = args[0]
        query_str = str(query_obj)

        # Check for key optimization components
        assert "json_build_object" in query_str
        assert "json_agg" in query_str
        assert "ST_AsGeoJSON" in query_str

        # Check that we are using a subquery to limit results BEFORE aggregation
        # (This is a heuristic check, the exact structure is implementation detail but critical)
        assert "LIMIT 100" in query_str.upper()

    finally:
        app.dependency_overrides = {}
