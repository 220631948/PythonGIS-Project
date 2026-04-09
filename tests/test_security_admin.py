import pytest
import os
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@patch('app.api.metadata_api._refresh_cache')
@patch('app.dependencies.settings.ADMIN_API_KEY', 'test_key')
def test_metadata_refresh_auth(mock_refresh):
    response = client.post("/api/catalog/refresh")
    assert response.status_code in [401, 403]
    mock_refresh.assert_not_called()
