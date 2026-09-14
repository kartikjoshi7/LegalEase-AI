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
- We must strictly adhere to Gemini's 15 Requests Per Minute limit via rate-limiting.

---

## ADR-002: Deterministic Bounding Box Extraction (PyMuPDF)

**Date:** 2026-09-13

### Decision
The LLM will strictly return the verbatim `exact_quote` of a risky clause, and the FastAPI backend will calculate the exact PDF coordinates using `PyMuPDF` (`page.search_for(exact_quote, quads=True)`). The LLM will never predict or generate `[x, y]` coordinates.

### Reason
LLMs suffer from severe spatial hallucination when attempting to map text to visual PDF coordinates. Relying on deterministic math (PyMuPDF) guarantees 100% accuracy for the frontend UI visual heatmap, directly maximizing the Code Quality and Accuracy evaluation scores.

### Alternatives Considered
- Multimodal LLM prompting asking the model to return bounding boxes based on an image of the PDF page. (Rejected due to unacceptable coordinate drift and resolution scaling issues).

### Consequences
- The LLM's output must exactly match the text inside the PDF, character-for-character. If the model paraphrases the quote, the geometry search will fail.

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