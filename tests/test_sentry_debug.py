import importlib
from unittest.mock import patch
from fastapi.testclient import TestClient

def test_sentry_debug_security():
    """
    Verify that the /sentry-debug endpoint is protected by admin authentication.
    Ensure Sentry is disabled and re-initialized safely.
    """
    # Patch SENTRY_DSN to prevent Sentry initialization during app reload
    with patch("app.config.settings.SENTRY_DSN", ""):
        # Reload app.main so init_sentry() runs with the patched settings (empty DSN)
        import app.main
        importlib.reload(app.main)
        from app.main import app

        # Patch ADMIN_API_KEY to enforce authentication
        # We patch the attribute on the singleton settings instance in app.config
        with patch("app.config.settings.ADMIN_API_KEY", "sentinel-secret-key"):

            client = TestClient(app)

            # 1. Test unauthorized access (No key)
            response = client.get("/sentry-debug")
            assert response.status_code == 403
            assert response.json() == {"detail": "Invalid or missing admin API key (X-Admin-API-Key header)."}

            # 2. Test unauthorized access (Wrong key)
            response = client.get("/sentry-debug", headers={"X-Admin-API-Key": "wrong-key"})
            assert response.status_code == 403

            # 3. Test authorized access (Correct key)
            # raise_server_exceptions=False ensures we get the 500 response instead of an exception
            client_auth = TestClient(app, raise_server_exceptions=False)
            response = client_auth.get("/sentry-debug", headers={"X-Admin-API-Key": "sentinel-secret-key"})

            # Should return 500 because the endpoint intentionally raises ZeroDivisionError
            assert response.status_code == 500
