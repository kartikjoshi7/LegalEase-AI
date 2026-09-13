# Data Model

## 1. Primary Database (Firebase Firestore)

Firestore handles user authentication, document metadata, and historical audit logs. To maintain zero costs on the Spark Plan, raw text and heavy embeddings are strictly kept out of this database.

### Collection: `users`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` | PK (Firebase Auth UID) | Primary identifier. |
| `email` | `string` | UNIQUE, NOT NULL | User's email address. |
| `created_at` | `timestamp` | NOT NULL | Account creation date. |

### Collection: `documents`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` | PK (Auto-ID) | Unique document identifier. |
| `user_id` | `string` | FK (`users.id`) | The owner of the document. |
| `file_name` | `string` | NOT NULL | Original filename (e.g., `lease.pdf`). |
| `pii_scrubbed` | `boolean` | NOT NULL | Verifies client-side scrubbing occurred. |
| `created_at` | `timestamp` | NOT NULL | Upload timestamp. |

### Collection: `analyses`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` | PK (Auto-ID) | Unique analysis identifier. |
| `document_id` | `string` | FK (`documents.id`) | The evaluated document. |
| `fairness_score` | `number` | `0-100` | The calculated safety score. |
| `executive_summary`| `string` | NOT NULL | Plain-English summary. |
| `flagged_clauses` | `array[map]`| NOT NULL | Array of identified risks. |

### Database Rules & Relationships
*   **User 1 ─── N Documents:** A user can upload multiple contracts.
*   **Document 1 ─── 1 Analysis:** Each contract generates one primary audit report.
*   **Security (Row-Level):** Firestore Security Rules MUST restrict read/write access so `user_id` strictly matches `request.auth.uid`.
*   **Data Retention:** Documents and analyses cascade to soft-delete when a user deletes their account.

## 2. Vector Knowledge Base (ChromaDB)

Runs completely in-memory (`chromadb.EphemeralClient`) during the FastAPI runtime to avoid managed database fees.

### Collection: `statutory_baselines`
| Field | Type | Storage Level | Description |
|---|---|---|---|
| `id` | `string` | Chroma ID | UUID for the text chunk. |
| `embedding` | `vector` | Chroma Embedding | Mathematical representation of the clause. |
| `document` | `string` | Chroma Document | Verbatim text of a fair, market-standard clause. |
| `metadata.type` | `string` | Metadata | e.g., `residential_lease`, `freelance_nda`. |

## 3. Pydantic Schemas (Gemini API Enforcements)

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