from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from schemas.api_models import (
    AnalyzeRiskRequest, 
    AnalyzeRiskResponse, 
    SimplifyRequest, 
    SimplifyResponse,
    AskQuestionRequest,
    AskQuestionResponse,
    ClauseRiskWithGeometry,
    Geometry,
    Quad
)
from services.llm_engine import analyze_document_risk, simplify_legal_jargon, answer_document_question
from services.pdf_processor import find_exact_quote_coordinates
import uuid
import re
import logging
from limiter import limiter

logger = logging.getLogger("legalease.api")

def _check_for_unredacted_pii(text: str):
    """
    Ensures that no unredacted SSNs or Credit Cards are sent to the LLM.
    Enforces SECURITY.md REQ-EVAL-001 on the backend.
    """
    if not text:
        return
    # Match SSN (###-##-####)
    if re.search(r"\b\d{3}-\d{2}-\d{4}\b", text):
        raise HTTPException(status_code=400, detail="INVALID_REQUEST: UNREDACTED_PII_DETECTED")
    # Match Credit Card (16 digits with optional spaces or dashes)
    if re.search(r"\b(?:\d{4}[ -]?){3}\d{4}\b", text):
        raise HTTPException(status_code=400, detail="INVALID_REQUEST: UNREDACTED_PII_DETECTED")


router = APIRouter(tags=["Analyze"])


@router.post("/analyze/ask", response_model=AskQuestionResponse)
@limiter.limit("5/minute")
async def ask_question(request_data: AskQuestionRequest, request: Request):
    """
    Answers user questions based strictly on the document text.
    """
    _check_for_unredacted_pii(request_data.document_text)
    _check_for_unredacted_pii(request_data.question)
    
    answer = await answer_document_question(
        document_text=request_data.document_text,
        question=request_data.question
    )
    
    return AskQuestionResponse(answer=answer)

@router.post("/analyze/risk", response_model=AnalyzeRiskResponse)
@limiter.limit("5/minute")
async def analyze_risk(
    request: Request,
    file: UploadFile = File(...),
    document_id: str = Form(..., max_length=1000),
    document_text: str = Form(..., max_length=1000000),
    contract_type: str = Form(..., max_length=1000),
    user_context: str | None = Form(None, max_length=10000)
):
    """
    Core evaluation engine. Analyzes risk and maps coordinates via PyMuPDF.
    """
    logger.info(f"Starting risk analysis for document_id: {document_id}")
    
    try:
        pdf_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file {document_id}: {e}")
        raise HTTPException(status_code=400, detail="FILE_READ_ERROR")
    
    _check_for_unredacted_pii(document_text)
    if user_context:
        _check_for_unredacted_pii(user_context)
    
    # 1. Send the scrubbed text to Gemini
    llm_output = await analyze_document_risk(
        document_text=document_text,
        contract_type=contract_type,
        user_context=user_context
    )
    
    # 2. Map coordinates for each flagged clause using PyMuPDF on the raw file bytes
    flagged_clauses_with_geometry = []
    
    def _run_geometry_matching(quote: str):
        return find_exact_quote_coordinates(pdf_bytes, quote)
        
    for clause in llm_output.flagged_clauses:
        # Guardrail: Enforce exact quote validation (Hallucination Defense)
        if clause.exact_quote not in document_text:
            logger.warning(f"Hallucinated quote detected and rejected: {clause.exact_quote}")
            raise HTTPException(status_code=422, detail="UNPROCESSABLE_ENTITY: HALLUCINATED_QUOTE")
            
        try:
            geometry = await run_in_threadpool(_run_geometry_matching, clause.exact_quote)
            
            # Create Quad objects
            quads_list = [Quad(**q) for q in geometry["quads"]]
            geo_obj = Geometry(page_number=geometry["page_number"], quads=quads_list)
            
            clause_with_geo = ClauseRiskWithGeometry(
                **clause.model_dump(),
                geometry=geo_obj
            )
            flagged_clauses_with_geometry.append(clause_with_geo)
            
        except HTTPException as e:
            # Rethrow GEOMETRY_MATCH_FAILED if it occurs
            raise e
            
    # 3. Construct Final Response
    response = AnalyzeRiskResponse(
        analysis_id=f"analysis_{uuid.uuid4().hex[:8]}",
        fairness_score=llm_output.fairness_score,
        executive_summary=llm_output.executive_summary,
        flagged_clauses=flagged_clauses_with_geometry
    )
    
    logger.info(f"Successfully completed risk analysis for document_id: {document_id}")
    return response

@router.post("/analyze/simplify", response_model=SimplifyResponse)
@limiter.limit("5/minute")
async def simplify_jargon(request_data: SimplifyRequest, request: Request):
    """
    Translates dense jargon into 8th-grade reading level.
    """
    _check_for_unredacted_pii(request_data.target_text)
    
    llm_output = await simplify_legal_jargon(target_text=request_data.target_text)
    
    return SimplifyResponse(
        plain_english_translation=llm_output.plain_english_translation,
        is_standard=llm_output.is_standard
    )
