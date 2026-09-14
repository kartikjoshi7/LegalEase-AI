import pytest
from httpx import AsyncClient, ASGITransport
from main import app
import os

@pytest.mark.live
@pytest.mark.asyncio
async def test_live_analyze_risk():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        pytest.skip("GEMINI_API_KEY not set. Skipping live test.")
        
    payload = {
        "document_id": "test.pdf",
        "document_text": "Tenant agrees to indemnify and hold Landlord harmless against any and all claims, actions, damages, liabilities and expenses in connection with loss of life, personal injury or damage to property arising from any occurrence in or upon the Leased Premises.",
        "contract_type": "commercial_lease"
    }
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/analyze/risk", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "fairness_score" in data
    assert "flagged_clauses" in data
    assert len(data["flagged_clauses"]) > 0
    # Verify strict JSON schema compliance from live Gemini model
    for clause in data["flagged_clauses"]:
        assert "clause_type" in clause
        assert "exact_quote" in clause
        assert "plain_english" in clause
        assert "severity" in clause
        assert clause["severity"] in ["Low", "Medium", "High", "Critical"]
