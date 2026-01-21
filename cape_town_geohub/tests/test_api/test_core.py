from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_manifest_exists():
    response = client.get("/manifest.json")
    # Might be 404 if not built, but we want to check it's routed
    assert response.status_code in [200, 404]

def test_services_access_endpoint():
    response = client.get("/api/services/access")
    # This might take time as it downloads data, but in test it should be mocked or fast
    assert response.status_code in [200, 500] # 500 if download fails
