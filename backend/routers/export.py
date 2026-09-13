from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from routers.auth import verify_firebase_token

router = APIRouter(tags=["Export"])

class ExportDossierRequest(BaseModel):
    document_id: str
    analysis_id: str
    include_counter_drafts: bool

class ExportDossierResponse(BaseModel):
    dossier_url: str
    executive_summary: str
    suggested_attorney_questions: List[str]
    timeline_obligations: List[str]

@router.post("/export/dossier", response_model=ExportDossierResponse)
async def export_attorney_dossier(
    request: ExportDossierRequest, 
    user: dict = Depends(verify_firebase_token)
):
    """
    Compiles the risk heatmap, simplified text, and missing protections into a structured JSON/PDF intake brief.
    Requires Authentication.
    """
    # MOCK IMPLEMENTATION FOR ARCHITECTURE SCAFFOLDING
    return ExportDossierResponse(
        dossier_url=f"https://api.legalease-ai.onrender.com/downloads/dossier_{request.document_id}.pdf",
        executive_summary="The contract presents a high risk due to uncapped liability and unilateral arbitration.",
        suggested_attorney_questions=[
            "Can we strike the unilateral arbitration clause on page 2?",
            "Is the non-compete radius of 50 miles legally enforceable in my state?"
        ],
        timeline_obligations=[
            "Notice of termination required 60 days in advance.",
            "Security deposit return required within 14 days of vacancy."
        ]
    )
