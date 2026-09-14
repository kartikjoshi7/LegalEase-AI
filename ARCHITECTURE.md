# Architecture

## High-Level System Design

Client (React SPA)
  ↓ (REST API / JSON)
API Gateway (FastAPI)
  ↓ (Business Logic & Orchestration)
Document Processing (PyMuPDF)
  ↓ (LLM Inference)
Generative Engine (Google Gemini API)

## Component Responsibilities & Tech Stack

### 1. Frontend (Presentation Layer)
*   **Tech:** React (Vercel Free Tier).
*   **Responsibility:** Handles dual-canvas UI rendering for PDF viewing and side-by-side translation.
*   **Constraints:** MUST scrub all PII (Personally Identifiable Information) before transmitting text payloads to the backend API.
*   **Keep-Alive Strategy:** Triggers an automated background heartbeat ping every 5 minutes to prevent the Render backend from entering a cold-start sleep state.

### 2. Backend API (Application Services)
*   **Tech:** Python / FastAPI (Render Free Web Service).
*   **Responsibility:** Acts as the async API gateway orchestrating the document pipeline.
*   **Parsing Logic:** Utilizes `PyMuPDF` (`fitz`) to extract raw text and perform deterministic coordinate matching. 
*   **Coordinate Extraction:** When the generative model returns an exact text quote, the backend uses `page.search_for(needle, quads=True)` to retrieve a list of precise quadrilateral bounding boxes. This prevents LLM-hallucinated UI coordinate drift.
*   **Rate Limiting:** Implements strict API rate limits to adhere to the Gemini free-tier quotas (15 requests per minute).

### 3. Generative AI Engine
*   **Tech:** Google Gemini API (gemini-2.5-flash-lite).
*   **Responsibility:** Performs the heavy NLP reasoning, semantic diffing, and risk-scoring.
*   **Structured Output:** Enforces strict adherence to application requirements using the `response_schema` parameter to guarantee that the model output will strictly follow a predictable JSON structure. It ties directly to a Pydantic `BaseModel` class to parse the JSON into a Python object.

## Dependency Direction & Rules

*   **Frontend MUST NOT** manage raw PDF storage; documents are processed in memory and immediately discarded.
*   **FastAPI Controllers MUST NOT** rely on the LLM for spatial reasoning or UI geometry; all layout calculations belong to PyMuPDF.
*   **External APIs MUST** be wrapped in robust error handling to gracefully degrade if the 15 RPM rate limit is temporarily breached.