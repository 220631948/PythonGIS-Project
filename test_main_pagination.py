import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_pagination():
    # We will test the default fallback path of main
    response = client.get("/api/data/precincts?limit=5&offset=0")
    print(response.status_code)
    data = response.json()
    assert "metadata" in data
    assert "geojson" in data or "features" in data
    print("test_pagination passed!")

if __name__ == "__main__":
    test_pagination()
