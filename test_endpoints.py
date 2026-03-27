from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_transport_endpoint():
    response = client.get("/api/transport/accessibility?lat=-33.9249&lon=18.4241&simplify=0.001")
    assert response.status_code == 200
    assert "error" not in response.json()

def test_safety_endpoint():
    response = client.get("/api/safety/precincts?simplify=0.001")
    assert response.status_code == 200
    assert "error" not in response.json()

if __name__ == "__main__":
    test_transport_endpoint()
    test_safety_endpoint()
    print("All tests passed!")
