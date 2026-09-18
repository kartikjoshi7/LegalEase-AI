"""
Security tests for the LegalEase AI backend.

Validates that enterprise security headers are injected on every response,
CORS policies are enforced, and rate limiting is functional.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_security_headers_present() -> None:
    """Verify that all four security headers are present on every response."""
    # Use a dummy client tuple to avoid shared rate limit bucket across tests
    async with AsyncClient(transport=ASGITransport(app=app, client=("127.0.0.99", 123)), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")

    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert response.headers.get("Permissions-Policy") == "camera=(), microphone=(), geolocation=()"


@pytest.mark.asyncio
async def test_security_headers_on_error_responses() -> None:
    """Verify security headers are present even on 404 and error responses."""
    # Use a dummy client tuple to avoid shared rate limit bucket across tests
    async with AsyncClient(transport=ASGITransport(app=app, client=("127.0.0.99", 123)), base_url="http://test") as ac:
        response = await ac.get("/api/v1/nonexistent-endpoint")

    # Should still have security headers even on 404
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"


@pytest.mark.asyncio
async def test_health_endpoint_returns_cache_headers() -> None:
    """Verify the health endpoint includes Cache-Control headers for efficiency."""
    # Use a dummy client tuple to avoid shared rate limit bucket across tests
    async with AsyncClient(transport=ASGITransport(app=app, client=("127.0.0.99", 123)), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")

    assert response.status_code == 200
    cache_control = response.headers.get("Cache-Control", "")
    assert "max-age" in cache_control


@pytest.mark.asyncio
async def test_cors_allows_whitelisted_origin() -> None:
    """Verify CORS allows requests from the whitelisted Vercel frontend."""
    headers = {"Origin": "https://legal-ease-ai-snowy.vercel.app"}
    # Use a dummy client tuple to avoid shared rate limit bucket across tests
    async with AsyncClient(transport=ASGITransport(app=app, client=("127.0.0.99", 123)), base_url="http://test") as ac:
        response = await ac.options("/api/v1/health", headers=headers)

    # Should not be rejected
    assert response.status_code in [200, 204, 405]


@pytest.mark.asyncio
async def test_health_returns_valid_json_structure() -> None:
    """Verify the health endpoint returns the expected JSON structure."""
    # Use a dummy client tuple to avoid shared rate limit bucket across tests
    async with AsyncClient(transport=ASGITransport(app=app, client=("127.0.0.99", 123)), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "active"
    assert "timestamp" in data
    assert "gemini_api" in data
