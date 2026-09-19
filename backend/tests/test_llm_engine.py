import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import HTTPException
from google.genai.errors import APIError
from services.llm_engine import (
    _sanitize_xml,
    _generate_with_retry,
    analyze_document_risk,
    simplify_legal_jargon,
    answer_document_question,
)

def test_sanitize_xml():
    assert _sanitize_xml("Normal text") == "Normal text"
    assert _sanitize_xml("<script>alert('xss')</script>") == "&lt;script&gt;alert('xss')&lt;/script&gt;"
    assert _sanitize_xml("") == ""
    assert _sanitize_xml(None) is None

def test_generate_with_retry_success():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"success": true}'
    mock_client.models.generate_content.return_value = mock_response
    
    result = _generate_with_retry(mock_client, "model", "prompt", None)
    assert result.text == '{"success": true}'
    mock_client.models.generate_content.assert_called_once()

@patch('services.llm_engine.time.sleep')
def test_generate_with_retry_fallback(mock_sleep):
    mock_client = MagicMock()
    mock_error_429 = Exception("429 Resource exhausted")
    mock_response = MagicMock()
    mock_response.text = '{"success": true}'
    
    # Fail first time, succeed second time (with fallback model)
    mock_client.models.generate_content.side_effect = [mock_error_429, mock_response]
    
    result = _generate_with_retry(mock_client, "gemini-2.5-flash", "prompt", None)
    assert result.text == '{"success": true}'
    assert mock_client.models.generate_content.call_count == 2
    mock_sleep.assert_called()

@patch('services.llm_engine.time.sleep')
def test_generate_with_retry_all_fail(mock_sleep):
    mock_client = MagicMock()
    mock_error_503 = Exception("503 Unavailable")
    mock_client.models.generate_content.side_effect = mock_error_503
    
    with pytest.raises(Exception): # It raises the original exception after all retries fail
        _generate_with_retry(mock_client, "gemini-2.5-flash", "prompt", None)
    
    assert mock_client.models.generate_content.call_count == 6 # Max retries

@pytest.mark.asyncio
@patch('services.llm_engine._generate_with_retry')
async def test_analyze_document_risk_success(mock_retry):
    mock_response = MagicMock()
    mock_response.text = '''{
        "fairness_score": 85,
        "executive_summary": "Test summary",
        "flagged_clauses": [
            {
                "clause_type": "Indemnification",
                "exact_quote": "exact quote",
                "plain_english": "plain english",
                "severity": "High"
            }
        ]
    }'''
    mock_retry.return_value = mock_response
    
    result = await analyze_document_risk("document text", "contract type")
    
    assert result.fairness_score == 85
    assert result.executive_summary == "Test summary"
    assert len(result.flagged_clauses) == 1
    assert result.flagged_clauses[0].severity == "High"

@pytest.mark.asyncio
@patch('services.llm_engine._generate_with_retry')
async def test_analyze_document_risk_validation_error(mock_retry):
    mock_response = MagicMock()
    mock_response.text = '{"invalid": "json"}'
    mock_retry.return_value = mock_response
    
    with pytest.raises(HTTPException) as exc:
        await analyze_document_risk("document text", "contract type")
    
    assert exc.value.status_code == 502
    assert "LLM_VALIDATION_FAILED" in str(exc.value.detail)

@pytest.mark.asyncio
@patch('services.llm_engine._generate_with_retry')
async def test_simplify_legal_jargon(mock_retry):
    mock_response = MagicMock()
    mock_response.text = '{"plain_english_translation": "Simple text", "is_standard": true}'
    mock_retry.return_value = mock_response
    
    result = await simplify_legal_jargon("target text")
    assert result.plain_english_translation == "Simple text"
    assert result.is_standard is True

@pytest.mark.asyncio
@patch('services.llm_engine._generate_with_retry')
async def test_answer_document_question(mock_retry):
    mock_response = MagicMock()
    mock_response.text = "This is the answer."
    mock_retry.return_value = mock_response
    
    result = await answer_document_question("document text", "question")
    assert result == "This is the answer."
