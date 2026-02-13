import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_security_headers():
    client = TestClient(app)
    response = client.get("/health")
    
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "Strict-Transport-Security" in response.headers
    assert "Content-Security-Policy" in response.headers
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

if __name__ == "__main__":
    client = TestClient(app)
    response = client.get("/health")
    print(f"Headers: {response.headers}")
