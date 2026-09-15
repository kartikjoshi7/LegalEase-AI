# API Specification: LegalEase AI

## Global Configuration & Rules

- **Base URL (Production):** `https://api.legalease-ai.onrender.com`
- **Base URL (Development):** `http://localhost:8000`
- **Authentication:** None. Zero-friction access for immediate analysis.
- **CORS:** Strictly restricted to the Vercel production frontend and localhost.
- **Data Privacy (REQ-EVAL-001):** The frontend MUST execute client-side regex-based PII scrubbing (masking names, SSNs, addresses, phone numbers) before sending `document_text` to ANY of these endpoints.
- **Error Standard:** All errors strictly follow the uniform `{"error": "CODE", "message": "Human readable"}` JSON format.

## 1. System Health & Keep-Alive

Prevents the Render free-tier container from cold-starting. Pinged every 5 minutes by the React frontend.

**`GET /api/v1/health`**

*Request Headers:* None
*Request Body:* None

*Success Response (200 OK):*
```json
{
  "status": "active",
  "timestamp": "2026-09-13T19:45:30Z",
  "gemini_api": "connected"
}
```

## 2. Document Risk Analysis & Visual Heatmap

The core evaluation engine. Identifies asymmetrical liabilities and maps them to exact document coordinates using PyMuPDF to render the UI heatmap.

**`POST /api/v1/analyze/risk`**

*Request Headers:* `Content-Type: multipart/form-data`

*Request Body (Form Data):*
- `file`: `UploadFile` (The raw PDF binary)
- `document_id`: `string`
- `document_text`: `string` (The PII-scrubbed document text)
- `contract_type`: `string`
- `user_context`: `string` (Optional)

*Success Response (200 OK):*
```json
{
  "analysis_id": "analysis_987xyz",
  "fairness_score": 65,
  "executive_summary": "The contract presents a high risk due to uncapped liability and unilateral arbitration.",
  "flagged_clauses": [
    {
      "clause_type": "Indemnification",
      "severity": "Critical",
      "exact_quote": "Tenant agrees to indemnify and hold Landlord harmless...",
      "plain_english": "You take full financial responsibility for any lawsuits on the property.",
      "counter_draft": "Tenant indemnifies Landlord only for gross negligence.",
      "geometry": {
        "page_number": 3,
        "quads": [
          {"ul": [120.5, 340.2], "ur": [450.0, 340.2], "ll": [120.5, 360.5], "lr": [450.0, 360.5]}
        ]
      }
    }
  ]
}
```

## 3. Bilingual Jargon Simplifier

Translates dense, unflagged legal jargon into an 8th-grade reading level. Triggered when a user clicks a specific paragraph in the UI they want to understand.

**`POST /api/v1/analyze/simplify`**

*Request Headers:* `Content-Type: application/json`

*Request Body:*
```json
{
  "document_id": "doc_123abc",
  "target_text": "Force Majeure: Neither party shall be liable for any failure of performance..."
}
```

*Success Response (200 OK):*
```json
{
  "plain_english_translation": "Neither side is responsible if an uncontrollable event (like a natural disaster or war) prevents them from doing what they promised in the contract.",
  "is_standard": true
}
```

## 4. Differential Contract Auditing (Statutory Diffing)

Compares an uploaded contract against standard, fair baselines to detect missing consumer protections or unilateral biases.

**`POST /api/v1/analyze/compare`**

*Request Headers:* `Content-Type: application/json`

*Request Body:*
```json
{
  "document_id": "doc_123abc",
  "document_text": "...",
  "baseline_category": "freelance_nda",
  "jurisdiction": "Generic_US"
}
```

*Success Response (200 OK):*
```json
{
  "unilateral_bias_detected": true,
  "missing_protections": [
    {
      "protection_type": "Severability",
      "description": "If one clause is found illegal, the rest of the contract should still stand. This contract lacks this standard protection.",
      "suggested_addition": "If any provision of this Agreement is held to be unenforceable, the remaining provisions will remain in full force."
    }
  ]
}
```

## 5. Attorney Dossier Export

Compiles the risk heatmap, simplified text, and missing protections into a structured JSON/PDF intake brief for export or direct sharing with professional legal counsel.

**`POST /api/v1/export/dossier`**

*Request Headers:* `Content-Type: application/json`

*Request Body:*
```json
{
  "document_id": "doc_123abc",
  "analysis_id": "analysis_987xyz",
  "include_counter_drafts": true
}
```

*Success Response (200 OK):*
```json
{
  "dossier_url": "https://api.legalease-ai.onrender.com/downloads/dossier_123abc.pdf",
  "executive_summary": "The contract presents a high risk due to uncapped liability and unilateral arbitration.",
  "suggested_attorney_questions": [
    "Can we strike the unilateral arbitration clause on page 2?",
    "Is the non-compete radius of 50 miles legally enforceable in my state?"
  ],
  "timeline_obligations": [
    "Notice of termination required 60 days in advance.",
    "Security deposit return required within 14 days of vacancy."
  ]
}
```

## 6. Standard Error Responses

These error states apply globally to all `/api/v1/` endpoints.

*400 Bad Request (Invalid Input)*
```json
{
  "error": "INVALID_REQUEST",
  "message": "Missing required field: document_text"
}
```

*422 Unprocessable Entity (PyMuPDF Geometry Error)*
```json
{
  "error": "GEOMETRY_MATCH_FAILED",
  "message": "The exact_quote returned by the LLM could not be mathematically located in the document text."
}
```

*429 Too Many Requests (Gemini API Limit)*
```json
{
  "error": "RATE_LIMITED",
  "message": "Analysis queue is full due to free-tier limits. Please try again in 60 seconds."
}
```

*502 Bad Gateway (LLM Generation Error)*
```json
{
  "error": "LLM_GENERATION_FAILED",
  "message": "The generative AI engine returned an unstructured or malformed response that violates the JSON schema."
}
```