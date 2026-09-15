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
from limiter import limiter

router = APIRouter(tags=["Analyze"])


@router.post("/analyze/ask", response_model=AskQuestionResponse)
@limiter.limit("5/minute")
async def ask_question(request_data: AskQuestionRequest, request: Request):
    """
    Answers user questions based strictly on the document text.
    """
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
    pdf_bytes = await file.read()
    
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
    
    return response

@router.post("/analyze/simplify", response_model=SimplifyResponse)
@limiter.limit("5/minute")
async def simplify_jargon(request_data: SimplifyRequest, request: Request):
    """
    Translates dense jargon into 8th-grade reading level.
    """
    llm_output = await simplify_legal_jargon(target_text=request_data.target_text)
    
    return SimplifyResponse(
        plain_english_translation=llm_output.plain_english_translation,
        is_standard=llm_output.is_standard
    )
