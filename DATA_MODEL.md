# Data Model

## 1. Pydantic Schemas (Gemini API Enforcements)

These define the exact JSON boundaries the LLM must follow via the `response_schema` parameter to guarantee zero-hallucination structured outputs.

### `ClauseRisk` (Object)
| Field | Type | Constraints | Description |
|---|---|---|---|
| `clause_type` | `string` | Enum: `[Indemnification, Arbitration, Liability, IP, Other]` | Categorization of the legal risk. |
| `exact_quote` | `string` | NOT NULL | The **exact substring** from the PDF. Used by PyMuPDF to extract coordinates. |
| `plain_english` | `string` | NOT NULL | Simplified translation of the risk at an 8th-grade reading level. |
| `severity` | `string` | Enum: `[Low, Medium, High, Critical]` | Risk level. |
| `counter_draft` | `string` | Nullable | A generated replacement clause if High/Critical. |

### `RiskAnalysisLLMOutput` (Object)
| Field | Type | Constraints | Description |
|---|---|---|---|
| `fairness_score` | `integer` | Range: `[0, 100]` | Calculated safety/fairness score out of 100. |
| `executive_summary` | `string` | NOT NULL | A plain-English executive summary of the document's risks. |
| `flagged_clauses` | `List[ClauseRisk]` | NOT NULL | List of identified asymmetrical liabilities or risks. |

### `SimplificationLLMOutput` (Object)
| Field | Type | Constraints | Description |
|---|---|---|---|
| `plain_english_translation` | `string` | NOT NULL | An 8th-grade reading level translation of the target text. |
| `is_standard` | `boolean` | NOT NULL | Whether this clause is standard for its contract type. |

## 2. Backend-Generated Geometry (PyMuPDF)

These objects are appended by the backend after PyMuPDF coordinate mapping. They are never returned by the LLM.

### `Quad` (Object)
| Field | Type | Description |
|---|---|---|
| `ul` | `List[float]` | Upper-left corner coordinates `[x, y]`. |
| `ur` | `List[float]` | Upper-right corner coordinates `[x, y]`. |
| `ll` | `List[float]` | Lower-left corner coordinates `[x, y]`. |
| `lr` | `List[float]` | Lower-right corner coordinates `[x, y]`. |

### `Geometry` (Object)
| Field | Type | Description |
|---|---|---|
| `page_number` | `integer` | 1-indexed page number where the quote was found. |
| `quads` | `List[Quad]` | List of quadrilateral bounding boxes for the matched text. |

## 3. API Specification (Frontend -> Backend)

**POST /api/v1/analyze/risk**
*   **Request (`multipart/form-data`):** `file` (PDF binary), `document_id` (string), `document_text` (Scrubbed string), `contract_type` (string), `user_context` (string, optional)
*   **Response (`application/json`):** `{"analysis_id": "uuid", "fairness_score": int, "executive_summary": "string", "flagged_clauses": [ClauseRisk + Geometry]}`

**POST /api/v1/analyze/simplify**
*   **Request (`application/json`):** `document_id` (string), `target_text` (string)
*   **Response (`application/json`):** `{"plain_english_translation": "string", "is_standard": boolean}`

**POST /api/v1/analyze/ask**
*   **Request (`application/json`):** `document_id` (string), `document_text` (string), `question` (string)
*   **Response (`application/json`):** `{"answer": "string"}`