# Data Model

## 1. Pydantic Schemas (Gemini API Enforcements)

These define the exact JSON boundaries the LLM must follow via the `response_schema` parameter to guarantee zero-hallucination structured outputs.

### `ClauseRisk` (Object)
| Field | Type | Constraints | Description |
|---|---|---|---|
| `clause_type` | `string` | Enum: `[Indemnification, Arbitration, Liability, IP, Other]` | Categorization of the legal risk. |
| `exact_quote` | `string` | NOT NULL | The **exact substring** from the PDF. Used by PyMuPDF to extract coordinates. |
| `plain_english` | `string` | NOT NULL | Simplified translation of the risk. |
| `severity` | `string` | Enum: `[Low, Medium, High, Critical]` | Risk level. |
| `counter_draft` | `string` | Nullable | A generated replacement clause if High/Critical. |
| `geometry` | `object` | Backend Generated | PyMuPDF geometry object containing `page_number` and `quads`. Not returned by LLM. |

## 4. API Specification (Frontend -> Backend)

**POST /api/v1/analyze/risk**
*   **Request:** `{"document_id": "uuid", "document_text": "Scrubbed string...", "contract_type": "string"}`
*   **Response:** `{"analysis_id": "uuid", "fairness_score": int, "flagged_clauses": [ClauseRisk + Quads]}`