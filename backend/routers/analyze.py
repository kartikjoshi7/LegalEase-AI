from fastapi import APIRouter, HTTPException, Request
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

router = APIRouter(tags=["Analyze"])

# Note: In a real environment, we'd fetch the raw PDF bytes from ephemeral storage 
# using the document_id. For this hackathon stub, we'll assume a dummy PDF byte stream.
DUMMY_PDF_BYTES = b"%PDF-1.4 dummy pdf bytes"

@router.post("/analyze/ask", response_model=AskQuestionResponse)
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
async def analyze_risk(request_data: AnalyzeRiskRequest, request: Request):
    """
    Core evaluation engine. Analyzes risk and maps coordinates via PyMuPDF.
    """
    # 1. Send the text to Gemini
    llm_output = await analyze_document_risk(
        document_text=request_data.document_text,
        contract_type=request_data.contract_type,
        user_context=request_data.user_context
    )
    
    # 2. Map coordinates for each flagged clause using PyMuPDF
    flagged_clauses_with_geometry = []
    for clause in llm_output.flagged_clauses:
        try:
            # In a full implementation, we'd fetch the actual uploaded PDF bytes here.
            # Using DUMMY_PDF_BYTES for architecture scaffolding.
            # geometry = find_exact_quote_coordinates(DUMMY_PDF_BYTES, clause.exact_quote)
            
            # Mocking the geometry response to satisfy the schema without a real PDF
            geometry = {
                "page_number": 1,
                "quads": [
                    {"ul": [0.0, 0.0], "ur": [10.0, 0.0], "ll": [0.0, 10.0], "lr": [10.0, 10.0]}
                ]
            }
            
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
async def simplify_jargon(request_data: SimplifyRequest, request: Request):
    """
    Translates dense jargon into 8th-grade reading level.
    """
    llm_output = await simplify_legal_jargon(target_text=request_data.target_text)
    
    return SimplifyResponse(
        plain_english_translation=llm_output.plain_english_translation,
        is_standard=llm_output.is_standard
    )
