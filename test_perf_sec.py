import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_preload_cache_no_auth():
    response = client.post("/api/performance/cache/preload", json={"datasets": ["a"], "zoom_levels": [1]})
    assert response.status_code == 200 # If it doesn't require auth
    print("Preload works without auth!")

def test_stats_cache_no_auth():
    response = client.get("/api/performance/cache/stats")
    assert response.status_code == 200 # If it doesn't require auth
    print("Stats works without auth!")

test_preload_cache_no_auth()
test_stats_cache_no_auth()
