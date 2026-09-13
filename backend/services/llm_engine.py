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
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY missing. Returning mock data for UI testing.")
        # Return mock data matching the schema so the UI doesn't crash during testing
        return RiskAnalysisLLMOutput(
            fairness_score=42,
            executive_summary="[MOCK MODE - NO API KEY] This document contains significant asymmetrical liabilities heavily favoring the landlord. We recommend reviewing the arbitration and indemnification clauses before signing.",
            flagged_clauses=[
                {
                    "clause_type": "Indemnification",
                    "severity": "Critical",
                    "exact_quote": "Tenant agrees to indemnify and hold Landlord harmless",
                    "plain_english": "You take full financial responsibility for any lawsuits on the property, even if it's the landlord's fault.",
                    "counter_draft": "Tenant indemnifies Landlord only for gross negligence or intentional misconduct."
                }
            ]
        )

    gemini_client = get_gemini_client()
    
    prompt = f"""
    You are an expert institutional-grade legal document auditor.
    Analyze the following {contract_type} and identify asymmetrical liabilities, missing consumer protections, and critical risks.
    Return the EXACT quote for any flagged clause so it can be located in the original PDF.
    If a clause's severity is High or Critical, provide a market-standard counter_draft.
    
    You MUST return the output as a raw JSON object with the following exact structure:
    {{
        "fairness_score": int (0-100),
        "executive_summary": "string",
        "flagged_clauses": [
            {{
                "clause_type": "Indemnification" | "Arbitration" | "Liability" | "IP" | "Other",
                "exact_quote": "string",
                "plain_english": "string",
                "severity": "Low" | "Medium" | "High" | "Critical",
                "counter_draft": "string" // optional
            }}
        ]
    }}
    
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
                temperature=0.1, # Low temp for deterministic legal output
            ),
        )
        
        # Pydantic validation handles parsing
        result = RiskAnalysisLLMOutput.model_validate_json(response.text)
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ACTUAL GEMINI ERROR: {e}")
        raise HTTPException(
            status_code=502,
            detail={
                "error": "LLM_GENERATION_FAILED",
                "message": f"The generative AI engine failed: {str(e)}"
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
    
    You MUST return the output as a raw JSON object with the following exact structure:
    {{
        "plain_english_translation": "string",
        "is_standard": boolean
    }}
    
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
