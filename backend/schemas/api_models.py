from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid

# ==========================================
# Generative AI Response Schemas (Strict JSON)
# ==========================================

class ClauseRisk(BaseModel):
    clause_type: Literal["Indemnification", "Arbitration", "Liability", "IP", "Other"] = Field(
        description="Categorization of the legal risk."
    )
    exact_quote: str = Field(
        description="The EXACT substring from the PDF. Used to extract coordinates."
    )
    plain_english: str = Field(
        description="Simplified translation of the risk at an 8th-grade reading level."
    )
    severity: Literal["Low", "Medium", "High", "Critical"] = Field(
        description="Risk severity level."
    )
    counter_draft: Optional[str] = Field(
        None, description="A generated replacement clause if High/Critical."
    )

class RiskAnalysisLLMOutput(BaseModel):
    fairness_score: int = Field(
        ge=0, le=100, description="Calculated safety/fairness score out of 100."
    )
    executive_summary: str = Field(
        description="A plain-English executive summary of the document's risks."
    )
    flagged_clauses: List[ClauseRisk] = Field(
        description="List of identified asymmetrical liabilities or risks."
    )

class SimplificationLLMOutput(BaseModel):
    plain_english_translation: str = Field(
        description="An 8th-grade reading level translation of the target text."
    )
    is_standard: bool = Field(
        description="Whether this clause is standard for its contract type."
    )

# ==========================================
# Frontend API Request/Response Schemas
# ==========================================

class AnalyzeRiskRequest(BaseModel):
    document_id: str
    document_text: str
    contract_type: str
    user_context: Optional[str] = None

class Quad(BaseModel):
    ul: List[float]
    ur: List[float]
    ll: List[float]
    lr: List[float]

class Geometry(BaseModel):
    page_number: int
    quads: List[Quad]

class ClauseRiskWithGeometry(ClauseRisk):
    geometry: Geometry

class AnalyzeRiskResponse(BaseModel):
    analysis_id: str
    fairness_score: int
    executive_summary: str
    flagged_clauses: List[ClauseRiskWithGeometry]

class SimplifyRequest(BaseModel):
    document_id: str
    target_text: str

class SimplifyResponse(BaseModel):
    plain_english_translation: str
    is_standard: bool
