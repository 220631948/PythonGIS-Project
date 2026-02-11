import importlib

from fastapi.testclient import TestClient


def test_sentry_debug_returns_500(monkeypatch):
    # Ensure Sentry is not initialized during this test (avoid sending events)
    monkeypatch.delenv("SENTRY_DSN", raising=False)

    # Reload the app module so init_sentry reads the updated environment
    import app.main as main_mod

    importlib.reload(main_mod)

    client = TestClient(main_mod.app, raise_server_exceptions=False)

    response = client.get("/sentry-debug")
    assert response.status_code == 500
