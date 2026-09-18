"""
LLM Engine service for the LegalEase AI backend.

Manages all interactions with the Google Gemini API (gemini-2.5-flash)
for legal document analysis, clause simplification, and contextual Q&A.
Enforces strict Pydantic schema validation on all generative outputs.
"""
import os
import logging
from google import genai
from google.genai import types
from schemas.api_models import RiskAnalysisLLMOutput, SimplificationLLMOutput
from fastapi import HTTPException

logger = logging.getLogger("legalease.llm_engine")

# Initialize Gemini Client (Requires GEMINI_API_KEY env var)
client = None

def get_gemini_client():
    global client
    if client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY environment variable is not set.")
        client = genai.Client(api_key=api_key)
    return client

async def analyze_document_risk(document_text: str, contract_type: str, user_context: str | None = None) -> RiskAnalysisLLMOutput:
    """
    Sends the scrubbed document to Gemini for risk analysis.
    Enforces the RiskAnalysisLLMOutput Pydantic schema for structured JSON.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY missing. Returning mock data for UI testing.")
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
    
    context_directive = ""
    if user_context:
        context_directive = f"""
    CRITICAL INSTRUCTION: Analyze this contract from the explicit perspective of the user: "{user_context}".
    The Fairness Score, Executive Summary, and Auto-Draft Solutions MUST be aggressively tailored to protect this specific party's interests. 
    If a clause harms the user's stated interests, flag it as High/Critical. 
    Counter-drafts must neutralize the risk for this specific user.
    """

    prompt = f"""
    You are an expert institutional-grade legal document auditor.
    Analyze the following {contract_type} and identify asymmetrical liabilities, missing consumer protections, and critical risks.
    {context_directive}
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
        error_msg = str(e)
        logger.error("Gemini risk analysis failed: %s", error_msg, exc_info=True)
        
        friendly_message = "The generative AI engine failed to analyze the document."
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            friendly_message = "Our AI is currently experiencing high traffic. Please wait a moment and try again."
            
        raise HTTPException(
            status_code=502,
            detail={
                "error": "LLM_GENERATION_FAILED",
                "message": friendly_message
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
        error_msg = str(e)
        friendly_message = "The generative AI engine returned an unstructured or malformed response."
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            friendly_message = "Our AI is currently experiencing high traffic. Please wait a moment and try again."
            
        raise HTTPException(
            status_code=502,
            detail={
                "error": "LLM_GENERATION_FAILED",
                "message": friendly_message
            }
        )

async def answer_document_question(document_text: str, question: str) -> str:
    """
    Answers a user's question STRICTLY based on the provided document text.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "[MOCK MODE - NO API KEY] This is a mocked answer for UI testing."

    gemini_client = get_gemini_client()
    
    prompt = f"""
    You are an expert legal assistant. Your task is to answer the user's question based strictly on the provided legal document.
    
    CRITICAL INSTRUCTIONS TO PREVENT MISUSE:
    1. You MUST ONLY answer questions that are directly related to the provided document.
    2. If the user asks a general question, a coding question, or anything unrelated to the document, you must reply: "I can only answer questions related to the uploaded document."
    3. If the document does not contain the answer, state clearly: "The uploaded document does not specify or contain the answer to this question."
    4. Provide your answer in clear, concise plain English. Do not provide formal legal advice.
    
    <user_question>
    {question}
    </user_question>
    
    <document>
    {document_text}
    </document>
    """
    
    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
            ),
        )
        
        return response.text
        
    except Exception as e:
        error_msg = str(e)
        logger.error("Gemini Q&A failed: %s", error_msg, exc_info=True)
        
        friendly_message = "I'm sorry, I encountered an unexpected error while answering your question."
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
            friendly_message = "I'm currently receiving too many requests. Please wait a few seconds and ask again!"
            
        raise HTTPException(
            status_code=502,
            detail={
                "error": "LLM_GENERATION_FAILED",
                "message": friendly_message
            }
        )

