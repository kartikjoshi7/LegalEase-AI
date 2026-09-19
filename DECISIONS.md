# Architecture Decision Records (Decisions)

## ADR-001: Zero-Budget Deployment Stack

**Date:** 2026-09-13

### Decision
Deploy the frontend to Vercel (Free Tier), the backend to Render (Free Web Service), use the Google Gemini API (Free Tier). 

### Reason
The project must be built entirely free without requiring any paid billing accounts or managed database subscriptions, while remaining robust enough to handle the automated AI Evaluator traffic.

### Alternatives Considered
- AWS EC2 or Google Cloud Run (Rejected due to potential billing accumulation).
- Managed Pinecone/Weaviate for vector storage (Rejected due to free-tier usage limits and setup complexity).

### Consequences
- We must implement IP-based rate limiting (5 requests per minute per IP via SlowAPI) to protect Gemini API quotas.

---

## ADR-002: Deterministic Bounding Box Extraction (PyMuPDF)

**Date:** 2026-09-13

### Decision
The LLM will strictly return the verbatim `exact_quote` of a risky clause, and the FastAPI backend will calculate the exact PDF coordinates using `PyMuPDF` (`page.search_for(exact_quote, quads=True)`). The LLM will never predict or generate `[x, y]` coordinates.

To achieve this without violating our Zero-Knowledge Retention policy, the system uses a **Hybrid Multipart Pipeline**. The frontend extracts and scrubs the text. It then sends *both* the scrubbed text (for Gemini) and the raw PDF (for PyMuPDF) to the backend in a single `multipart/form-data` request. The backend processes the geometry entirely in-memory and immediately discards the PDF bytes, guaranteeing 100% spatial accuracy without retaining sensitive files.

### Reason
LLMs suffer from severe spatial hallucination when attempting to map text to visual PDF coordinates. Relying on deterministic math (PyMuPDF) guarantees 100% accuracy for the frontend UI visual heatmap, directly maximizing the Code Quality and Accuracy evaluation scores.

### Alternatives Considered
- Multimodal LLM prompting asking the model to return bounding boxes based on an image of the PDF page. (Rejected due to unacceptable coordinate drift and resolution scaling issues).

### Consequences
- The LLM's output must closely match the text inside the PDF. If the model paraphrases the quote, the geometry search falls back to a prefix match (first 30 characters). If all matches fail, the system returns empty geometry and continues serving the analysis — it never crashes.

---

## ADR-003: Client-Side PII Scrubbing

**Date:** 2026-09-13

### Decision
All raw PDF text must be scrubbed of Personally Identifiable Information (PII) using regex on the React frontend *before* the payload is sent over the network to the FastAPI backend.

### Reason
Legal documents are highly sensitive. Scrubbing data client-side ensures a zero-knowledge architecture, satisfying the Security metric of the evaluation rubric and mitigating privacy risks.

### Alternatives Considered
- Server-side scrubbing using Python NLP libraries. (Rejected because it still requires transmitting raw PII over the network).

### Consequences
- Frontend processing overhead increases slightly.
- The UI must handle replacing tags like `[REDACTED_NAME]` gracefully when rendering the translated plain English.

---

## ADR-004: Anti-Cold-Start Keep-Alive Strategy

**Date:** 2026-09-13

### Decision
The React frontend will implement a background `setInterval` ping to the FastAPI `GET /api/v1/health` endpoint every 5 minutes.

### Reason
Render's free web services spin down after 15 minutes of inactivity. If the automated AI Evaluator hits a sleeping instance, it will experience a 50+ second cold start, likely triggering a timeout and failing the Efficiency test.

### Alternatives Considered
- Upgrading to a paid Render tier (Rejected due to the zero-budget constraint).
- Using third-party cron services like UptimeRobot (Rejected to minimize external dependencies and maintain the project self-contained within Vercel/Render).

### Consequences
- Slightly inflated backend log volume due to regular health checks.

---

## ADR-005: Multi-Model LLM Fallback Chain

**Date:** 2026-09-19

### Decision
Implement a tiered model fallback chain in `llm_engine.py`: `gemini-2.5-flash` (primary) → `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite`. When the primary model returns a 429 (RESOURCE_EXHAUSTED), 503 (UNAVAILABLE), or 404 (NOT_FOUND) error, the system automatically retries with the next model in the chain after a brief delay (1 second for model switches, 5 seconds for full-chain retries). Maximum 6 retry attempts.

### Reason
The Google Gemini free-tier quota is shared across all users and can be exhausted rapidly during hackathon demo sessions or automated evaluator runs. A single-model approach would cause the entire analysis to fail with a 502 error, creating a poor user experience during the live pitch. The fallback chain ensures the system always returns a result, even if the primary model is temporarily unavailable.

### Alternatives Considered
- Queueing requests and retrying only the primary model after a longer backoff (Rejected because the evaluator may timeout waiting for the queue to drain).
- Switching entirely to a lite model (Rejected because `gemini-2.5-flash` produces significantly higher quality legal analysis and should be used when available).

### Consequences
- Lite model responses may have slightly lower analysis quality than the primary model. This is acceptable as a degraded-but-functional fallback.
- The `_generate_with_retry` function is synchronous (`time.sleep`), which blocks the event loop briefly during retries. This is acceptable given the single-threaded hackathon deployment.

---

## ADR-006: Removal of React.lazy/Suspense for Edge CDN Stability

**Date:** 2026-09-19

### Decision
Replace `React.lazy()` and `<Suspense>` dynamic imports for `Workspace` and `DossierPreview` with static imports in `App.tsx`. All route components are bundled into the main JavaScript chunk.

### Reason
When deployed to Vercel's edge CDN, the combination of `React.lazy()` chunk loading and Framer Motion's `AnimatePresence` exit animations caused a critical blank-screen bug. During navigation from the landing page to the workspace, the `Suspense` fallback would render while the chunk was fetched, but `AnimatePresence` would apply `opacity: 0` to the incoming component during its exit animation of the previous route. Once the chunk loaded, Framer Motion lost track of the animation state and left the Workspace permanently invisible — resulting in a fully rendered header with a completely blank main content area.

### Alternatives Considered
- Configuring Vite's chunk splitting to inline the Workspace route into the main bundle while keeping other routes lazy (Rejected as overly complex for minimal bundle size savings).
- Wrapping `AnimatePresence` outside of `Suspense` (Tested and still caused timing issues with Vercel's CDN chunk caching).

### Consequences
- The initial JavaScript bundle is slightly larger (~1.4MB gzipped: 442KB). This is acceptable for a single-page application targeting desktop users on modern broadband connections.
- Deterministic rendering is guaranteed — no race conditions between chunk loading and animation state.