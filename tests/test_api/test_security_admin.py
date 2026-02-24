import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.dependencies import require_admin_key

def test_require_admin_key_success():
    """Test access allowed when key matches."""
    with patch("app.dependencies.settings") as mock_settings:
        mock_settings.ADMIN_API_KEY = "secret-key"
        mock_settings.DEBUG = False

        result = require_admin_key(api_key="secret-key")
        assert result == "secret-key"

def test_require_admin_key_invalid_key():
    """Test access denied when key is incorrect."""
    with patch("app.dependencies.settings") as mock_settings:
        mock_settings.ADMIN_API_KEY = "secret-key"

        with pytest.raises(HTTPException) as exc:
            require_admin_key(api_key="wrong-key")

        assert exc.value.status_code == 403
        assert "Invalid or missing" in exc.value.detail

def test_require_admin_key_missing_key_debug_mode():
    """Test access allowed (unprotected) when key is missing but DEBUG is True."""
    with patch("app.dependencies.settings") as mock_settings:
        mock_settings.ADMIN_API_KEY = ""
        mock_settings.DEBUG = True

        result = require_admin_key(api_key="anything")
        assert result == "unprotected"

def test_require_admin_key_missing_key_production_mode():
    """Test access DENIED when key is missing and DEBUG is False."""
    with patch("app.dependencies.settings") as mock_settings:
        mock_settings.ADMIN_API_KEY = ""
        mock_settings.DEBUG = False

        with pytest.raises(HTTPException) as exc:
            require_admin_key(api_key="anything")

        assert exc.value.status_code == 403
        assert "Admin access is disabled" in exc.value.detail
