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
*   **Tech:** React 19, Vite 8, TypeScript, Tailwind CSS 4, Framer Motion, react-pdf, react-markdown (Vercel Free Tier).
*   **Responsibility:** Handles dual-canvas UI rendering for PDF viewing and side-by-side risk analysis workspace.
*   **Constraints:** MUST scrub all PII (Personally Identifiable Information) before transmitting text payloads to the backend API.
*   **Optimization:** Heavy components (`PDFViewer`, `RiskPanel`, `LandingHub`) are wrapped in `React.memo` to prevent unnecessary re-renders. All routes (`Workspace`, `DossierPreview`) are statically imported to ensure deterministic rendering and avoid Framer Motion `AnimatePresence` conflicts with dynamic chunk loading on edge CDN deployments.
*   **Keep-Alive Strategy:** Triggers an automated background heartbeat ping every 5 minutes to prevent the Render backend from entering a cold-start sleep state.
*   **SPA Routing:** Vercel is configured with a `vercel.json` rewrite rule (`/(.*) → /index.html`) to support client-side routing without 404 errors on direct page access.

### 2. Backend API (Application Services)
*   **Tech:** Python 3.12, FastAPI, Uvicorn, Pydantic, SlowAPI (Render Free Web Service).
*   **Responsibility:** Acts as the async API gateway orchestrating the document pipeline.
*   **Security Middleware:** Injects enterprise security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) on every response.
*   **Parsing Logic:** Utilizes `PyMuPDF` (`fitz`) to extract raw text and perform deterministic coordinate matching entirely in-memory.
*   **Coordinate Extraction:** When the generative model returns an exact text quote, the backend uses `page.search_for(needle, quads=True)` to retrieve precise quadrilateral bounding boxes. Falls back to prefix matching if line-breaks cause an exact match miss.
*   **Rate Limiting:** Implements strict IP-based rate limits via SlowAPI token bucket (5 req/min per IP) to protect Gemini API quotas.

### 3. Generative AI Engine
*   **Tech:** Google Gemini API via `google-genai` Python SDK with a resilient multi-model fallback chain.
*   **Primary Model:** `gemini-2.5-flash` (high-quality legal reasoning).
*   **Fallback Models:** `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` (activated automatically on 429/503/404 errors via exponential backoff in `_generate_with_retry`).
*   **Responsibility:** Performs the heavy NLP reasoning, semantic diffing, and risk-scoring.
*   **Structured Output:** Enforces strict adherence to application requirements using the `response_mime_type="application/json"` parameter to guarantee that the model output will strictly follow a predictable JSON structure. It ties directly to a Pydantic `BaseModel` class to parse the JSON into a Python object.
*   **Hallucination Defense:** Every `exact_quote` returned by the LLM is validated against the original document text in `analyze.py`. If the quote is not found as an identical substring, it is silently discarded before geometry mapping. This prevents fabricated clause data from reaching the frontend.
*   **Prompt Injection Defense:** Document text is sanitized via `_sanitize_xml()` to escape embedded `<` and `>` characters, and is strictly fenced inside XML delimiters (`<document_under_review>`) to prevent adversarial manipulation.

## Dependency Direction & Rules

*   **Frontend MUST NOT** manage raw PDF storage; documents are processed in memory and immediately discarded.
*   **FastAPI Controllers MUST NOT** rely on the LLM for spatial reasoning or UI geometry; all layout calculations belong to PyMuPDF.
*   **External APIs MUST** be wrapped in robust error handling with automatic model fallback to gracefully degrade if the rate limit is temporarily breached.
*   **LLM Outputs MUST** be validated against the source document before being passed to the geometry engine or frontend.