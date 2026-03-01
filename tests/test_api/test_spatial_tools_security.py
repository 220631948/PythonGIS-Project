import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from app.api.spatial_tools_api import get_nearby_features

@pytest.mark.anyio
async def test_get_nearby_features_valid_layer():
    mock_db = MagicMock()
    # Mock return value to be iterable
    from unittest.mock import AsyncMock
    mock_db = AsyncMock()
    class MockResult:
        def scalar(self):
            return '{"type":"FeatureCollection","features":[]}'
    mock_db.execute.return_value = MockResult()

    # Valid layer
    await get_nearby_features(
        layer="schools",
        lat=0.0,
        lon=0.0,
        radius=1000.0,
        db=mock_db
    )

    assert mock_db.execute.called

@pytest.mark.anyio
async def test_get_nearby_features_sql_injection_attempt():
    mock_db = MagicMock()

    # Malicious layer payload that attempts SQL injection
    malicious_layer = 'users" JOIN spatial_layers ON true OR "1"="1'

    with pytest.raises(HTTPException) as excinfo:
        await get_nearby_features(
            layer=malicious_layer,
            lat=0.0,
            lon=0.0,
            radius=1000.0,
            db=mock_db
        )

    assert excinfo.value.status_code == 400
    assert "Invalid layer name" in excinfo.value.detail
    assert not mock_db.execute.called

@pytest.mark.anyio
async def test_get_nearby_features_invalid_chars():
    mock_db = MagicMock()

    # Layer with invalid characters (e.g., spaces)
    invalid_layer = "some table"

    with pytest.raises(HTTPException) as excinfo:
        await get_nearby_features(
            layer=invalid_layer,
            lat=0.0,
            lon=0.0,
            radius=1000.0,
            db=mock_db
        )

    assert excinfo.value.status_code == 400
    assert not mock_db.execute.called
