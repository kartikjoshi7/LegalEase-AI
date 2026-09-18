import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_limiter_active():
    """
    Test that the rate limiter is actively rejecting requests 
    that exceed the limit on the health endpoint.
    """
    # Send 6 rapid requests (limit is 5/minute)
    for _ in range(5):
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    # The 6th should be rate limited
    response = client.get("/api/v1/health")
    assert "Rate limit exceeded" in response.text
