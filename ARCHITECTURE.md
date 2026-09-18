# Architecture

## High-Level System Design

Client (React SPA)
  ↓ (REST API / JSON & Multipart FormData)
API Gateway (FastAPI + Security Headers Middleware)
  ↓ (Business Logic & Orchestration)
Document Processing (PyMuPDF)
  ↓ (LLM Inference)
Generative Engine (Google Gemini API)

## Component Responsibilities & Tech Stack

### 1. Frontend (Presentation Layer)
*   **Tech:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, pdfjs-dist (Vercel Free Tier).
*   **Responsibility:** Handles dual-canvas UI rendering for PDF viewing and side-by-side risk analysis workspace.
*   **Constraints:** MUST scrub all PII (Personally Identifiable Information) before transmitting text payloads to the backend API.
*   **Optimization:** Heavy components (`PDFViewer`, `RiskPanel`, `LandingHub`) are wrapped in `React.memo` to prevent unnecessary re-renders. Routes (`Workspace`, `DossierPreview`) use `React.lazy()` with `<Suspense>` for code splitting.
*   **Keep-Alive Strategy:** Triggers an automated background heartbeat ping every 5 minutes to prevent the Render backend from entering a cold-start sleep state.

### 2. Backend API (Application Services)
*   **Tech:** Python 3.12, FastAPI, Uvicorn, Pydantic, SlowAPI (Render Free Web Service).
*   **Responsibility:** Acts as the async API gateway orchestrating the document pipeline.
*   **Security Middleware:** Injects enterprise security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) on every response.
*   **Parsing Logic:** Utilizes `PyMuPDF` (`fitz`) to extract raw text and perform deterministic coordinate matching entirely in-memory.
*   **Coordinate Extraction:** When the generative model returns an exact text quote, the backend uses `page.search_for(needle, quads=True)` to retrieve precise quadrilateral bounding boxes. Falls back to prefix matching if line-breaks cause an exact match miss.
*   **Rate Limiting:** Implements strict IP-based rate limits via SlowAPI token bucket (5 req/min per IP) to protect Gemini API quotas.

### 3. Generative AI Engine
*   **Tech:** Google Gemini API (gemini-2.5-flash) via `google-genai` Python SDK.
*   **Responsibility:** Performs the heavy NLP reasoning, semantic diffing, and risk-scoring.
*   **Structured Output:** Enforces strict adherence to application requirements using the `response_schema` parameter to guarantee that the model output will strictly follow a predictable JSON structure. It ties directly to a Pydantic `BaseModel` class to parse the JSON into a Python object.

## Dependency Direction & Rules

*   **Frontend MUST NOT** manage raw PDF storage; documents are processed in memory and immediately discarded.
*   **FastAPI Controllers MUST NOT** rely on the LLM for spatial reasoning or UI geometry; all layout calculations belong to PyMuPDF.
*   **External APIs MUST** be wrapped in robust error handling to gracefully degrade if the rate limit is temporarily breached.