import os
from google import genai
from google.genai import types
from schemas.api_models import RiskAnalysisLLMOutput, SimplificationLLMOutput
from fastapi import HTTPException

# Initialize Gemini Client (Requires GEMINI_API_KEY env var)
client = None

def get_gemini_client():
    global client
    if client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            # During development without a key, we might mock this, 
            # but for production it's required.
            print("WARNING: GEMINI_API_KEY environment variable is not set.")
        client = genai.Client(api_key=api_key)
    return client

async def analyze_document_risk(document_text: str, contract_type: str) -> RiskAnalysisLLMOutput:
    """
    Sends the scrubbed document to Gemini for risk analysis.
    Enforces the RiskAnalysisLLMOutput Pydantic schema for structured JSON.
    """
    gemini_client = get_gemini_client()
    
    prompt = f"""
    You are an expert institutional-grade legal document auditor.
    Analyze the following {contract_type} and identify asymmetrical liabilities, missing consumer protections, and critical risks.
    Return the EXACT quote for any flagged clause so it can be located in the original PDF.
    If a clause's severity is High or Critical, provide a market-standard counter_draft.
    
    <document_under_review>
    {document_text}
    </document_under_review>
    """
    
    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RiskAnalysisLLMOutput,
                temperature=0.1, # Low temp for deterministic legal output
            ),
        )
        
        # Pydantic validation handles parsing
        result = RiskAnalysisLLMOutput.model_validate_json(response.text)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "LLM_GENERATION_FAILED",
                "message": "The generative AI engine returned an unstructured or malformed response that violates the JSON schema."
            }
        )

async def simplify_legal_jargon(target_text: str) -> SimplificationLLMOutput:
    """
    Translates dense legal text into 8th-grade reading level.
    """
    gemini_client = get_gemini_client()
    
    prompt = f"""
    Translate the following legal clause into plain English at an 8th-grade reading level.
    Also indicate if this clause is standard for typical contracts.
    
    <clause>
    {target_text}
    </clause>
    """
    
    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SimplificationLLMOutput,
                temperature=0.2,
            ),
        )
        
        result = SimplificationLLMOutput.model_validate_json(response.text)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "LLM_GENERATION_FAILED",
                "message": "The generative AI engine returned an unstructured or malformed response that violates the JSON schema."
            }
        )
