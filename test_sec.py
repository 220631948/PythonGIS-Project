from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.post("/api/performance/cache/preload", json={"datasets": ["a"], "zoom_levels": [1]})
print(f"Preload response: {response.status_code}")

response = client.get("/api/performance/cache/stats")
print(f"Stats response: {response.status_code}")
