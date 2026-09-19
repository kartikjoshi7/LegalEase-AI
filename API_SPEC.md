# API Specification: LegalEase AI

## Global Configuration & Rules

- **Base URL (Production):** `https://legalease-ai-tcr9.onrender.com`
- **Base URL (Development):** `http://localhost:8000`
- **Authentication:** None. Zero-friction access for immediate analysis.
- **CORS:** Strictly restricted to the Vercel production frontend (`https://legal-ease-ai-snowy.vercel.app`) and localhost development origins.
- **Security Headers:** Every response includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **Rate Limiting:** IP-based token bucket via SlowAPI (5 requests per minute per IP).
- **Data Privacy:** The frontend MUST execute client-side regex-based PII scrubbing (masking names, SSNs, addresses, phone numbers) before sending `document_text` to ANY endpoint.
- **Error Standard:** All errors strictly follow the uniform `{"error": "CODE", "message": "Human readable"}` JSON format.

## 1. System Health & Keep-Alive

Prevents the Render free-tier container from cold-starting. Pinged every 5 minutes by the React frontend `KeepAlive` component.

**`GET /api/v1/health`**

*Request Headers:* None
*Request Body:* None

*Success Response (200 OK):*
```json
{
  "status": "active",
  "timestamp": "2026-09-18T19:45:30+00:00",
  "gemini_api": "connected"
}
```

*Response Headers:*
- `Cache-Control: public, max-age=60, stale-while-revalidate=30`

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

*Hallucination Defense:* The `flagged_clauses` array is post-processed by the backend before delivery. Any clause whose `exact_quote` is not found as an identical substring of the original `document_text` is silently discarded. This means the response may contain fewer clauses than the LLM originally generated — this is by design, not an error.

## 3. Clause Simplification (Simplifying Complex Legal Documents)

Translates dense legal jargon into an 8th-grade reading level. Triggered when a user selects a specific clause in the UI they want to understand.

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

## 4. Contextual Q&A (Answering Questions Based on Provided Legal Documents)

Answers user questions that are strictly grounded in the uploaded document text. Prevents hallucinations and off-topic responses by scoping answers to the provided document context.

**`POST /api/v1/analyze/ask`**

*Request Headers:* `Content-Type: application/json`

*Request Body:*
```json
{
  "document_id": "doc_123abc",
  "document_text": "...",
  "question": "Can the landlord enter my apartment without notice?"
}
```

*Success Response (200 OK):*
```json
{
  "answer": "According to Section 8.2 of your lease, the landlord must provide at least 24 hours written notice before entering the premises, except in cases of emergency."
}
```

## 5. Standard Error Responses

These error states apply globally to all `/api/v1/` endpoints.

*400 Bad Request (Invalid Input)*
```json
{
  "error": "INVALID_REQUEST",
  "message": "Missing required field: document_text"
}
```

*422 Unprocessable Entity (Validation Error)*
```json
{
  "error": "VALIDATION_ERROR",
  "message": "The provided payload does not conform to the expected schema."
}
```

*429 Too Many Requests (Rate Limited)*
```json
{
  "error": "Rate limit exceeded: 5 per 1 minute",
  "message": "Analysis queue is full due to rate limits. Please try again in 60 seconds."
}
```

*502 Bad Gateway (LLM Generation Error)*
```json
{
  "error": "LLM_GENERATION_FAILED",
  "message": "The generative AI engine returned an unstructured or malformed response that violates the JSON schema."
}
```