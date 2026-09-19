# Requirements Specification: LegalEase AI

## 1. Functional Requirements (Core Operations)

**REQ-FUNC-001: Document Ingestion & Parsing**
The system must accept PDF document uploads and utilize `PyMuPDF` to extract raw text content accurately, including multi-line paragraphs and tables, without altering the document's native coordinate geometry.

**REQ-FUNC-002: Plain English Translation**
The generative AI engine must translate complex legal clauses (e.g., indemnification, force majeure) into simplified, 8th-grade reading level explanations. 

**REQ-FUNC-003: Deterministic UI Highlighting (Zero-Hallucination)**
The generative AI must NOT predict or return bounding box coordinates. It must return the `exact_quote` of a flagged clause. The backend must use `PyMuPDF` (`page.search_for(exact_quote)`) to find the precise coordinates and map them to the frontend PDF viewer.

**REQ-FUNC-004: Contextual Q&A (Answering Questions Based on Provided Legal Documents)**
The system must answer user questions that are strictly grounded in the uploaded document text. Answers must be scoped to the provided document context to prevent hallucinations and off-topic responses.

**REQ-FUNC-005: Counter-Draft Generation**
For any clause flagged as highly risky (Severity is High or Critical), the system must generate a balanced, market-standard replacement clause formatted for easy copying.

**REQ-FUNC-006: Attorney Dossier Export**
The application must compile all flagged risks, generated counter-drafts, and suggested legal counsel questions into a downloadable JSON or PDF summary.

## 2. Security & AI Evaluator Requirements

**REQ-EVAL-001: Client-Side PII Scrubbing**
The frontend must locally redact Personally Identifiable Information (Names, Phone Numbers, Addresses, Social Security Numbers) using client-side RegEx/NLP before any text payload is transmitted to the backend API.

**REQ-EVAL-002: Strict JSON Output Enforcement**
All LLM inferences must utilize the Gemini API `response_schema` feature tightly coupled to a Pydantic `BaseModel`. The system must fail gracefully by returning a `502 Bad Gateway` (`LLM_GENERATION_FAILED`) error if the LLM attempts to return unstructured markdown.

**REQ-EVAL-003: WCAG Accessibility Compliance**
The frontend interface must support full keyboard navigation, ARIA labels for screen readers, and high-contrast toggles for visually impaired users to maximize the Accessibility score.

**REQ-EVAL-004: 10MB Repository Limit Compliance**
No PDF templates, vector databases, or compiled binaries (`node_modules`, `venv`) may be committed to the Git repository. The `.gitignore` must enforce this strictly.

## 3. Performance & Infrastructure Constraints

**REQ-PERF-001: Zero-Cost Architecture**
The system must not require paid databases or server instances. It must run exclusively on Vercel (Free), Render (Free Web Service), and the Google Gemini API (Free Tier).

**REQ-PERF-002: API Rate Limiting**
The backend must implement IP-based rate limiting via SlowAPI token bucket to protect the Gemini API quota (5 requests per minute per IP).

**REQ-PERF-003: Cold-Start Mitigation (Keep-Alive)**
The React frontend must ping a dedicated `/api/v1/health` endpoint on the Render backend every 5 minutes to prevent the container from sleeping, ensuring the AI Evaluator does not encounter a 50-second timeout error.

**REQ-PERF-004: LLM Resilience (Multi-Model Fallback)**
The backend must implement a multi-model fallback chain (`gemini-2.5-flash` → `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite`) with exponential backoff to ensure analysis requests succeed even when the primary model's free-tier quota is temporarily exhausted.

**REQ-PERF-005: Environment Configuration**
The backend must use `python-dotenv` to load environment variables from a `.env` file, ensuring consistent configuration across local development and production (Render) deployments without hardcoding secrets.

## 4. Frontend Dependencies

**REQ-FRONT-001: Rich AI Response Rendering**
The frontend must use `react-markdown` to render AI-generated Q&A responses with proper formatting (paragraphs, lists, bold text) instead of raw plaintext.
