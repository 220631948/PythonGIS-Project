import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_offline_package():
    # Attempt to post to offline-package
    response = client.post("/api/field/offline-package", json={"forms": [], "layers": []})
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "forms" in data
    assert "layers" in data
    print("test_offline_package passed!")

if __name__ == "__main__":
    test_offline_package()
