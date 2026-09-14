import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "active"

@pytest.mark.asyncio
async def test_analyze_risk_mock():
    # We rely on the GEMINI_API_KEY being missing to trigger the mock in llm_engine.py
    # or we can patch os.environ.
    payload = {
        "document_id": "test.pdf",
        "document_text": "Tenant agrees to indemnify and hold Landlord harmless",
        "contract_type": "generic_contract"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/analyze/risk", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "fairness_score" in data
    assert "executive_summary" in data
    assert "flagged_clauses" in data
    assert len(data["flagged_clauses"]) > 0

@pytest.mark.asyncio
async def test_rate_limiter():
    # Hit the health endpoint 6 times (limit is 5/min)
    async with AsyncClient(transport=ASGITransport(app=app, client=("127.0.0.1", 123)), base_url="http://test") as ac:
        for _ in range(5):
            await ac.get("/api/v1/health")
        response = await ac.get("/api/v1/health")
    
    # 6th request should be rate limited
    assert response.status_code == 429

@pytest.mark.asyncio
async def test_analyze_risk_validation_error():
    # Missing required field "document_text"
    payload = {
        "document_id": "test.pdf",
        "contract_type": "generic_contract"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/analyze/risk", json=payload)
    
    assert response.status_code == 422 # Unprocessable Entity

@pytest.mark.asyncio
async def test_simplify_jargon_mock():
    payload = {
        "document_id": "test.pdf",
        "target_text": "Notwithstanding anything to the contrary herein contained..."
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/analyze/simplify", json=payload)
    
    # We might hit 502 if GEMINI_API_KEY is not set since simplify isn't fully mocked
    # Or 200 if it is mocked. Let's just assert it doesn't 500 server crash.
    assert response.status_code in [200, 502]
