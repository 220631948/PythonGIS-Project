from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_perf_preload_with_auth():
    # Provide the auth key
    response = client.post(
        "/api/performance/cache/preload",
        json={"datasets": ["a"], "zoom_levels": [1]},
        headers={"X-Admin-API-Key": "test_admin_key"} # Matches settings or default?
    )
    print("Preload with auth:", response.status_code)

def test_perf_preload_without_auth():
    response = client.post(
        "/api/performance/cache/preload",
        json={"datasets": ["a"], "zoom_levels": [1]}
    )
    print("Preload without auth:", response.status_code)

test_perf_preload_with_auth()
test_perf_preload_without_auth()
