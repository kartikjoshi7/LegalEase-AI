# Testing Strategy & Verification: LegalEase AI

## 1. Overview

LegalEase AI relies on a rigorous, cross-platform testing pipeline managed by a unified `Makefile`. Before any code is committed or merged, it must pass verification across Code Quality, Security, Efficiency, Accessibility, and Repository Constraints.

The testing pyramid is divided into:
1. **Unit Tests:** Core functions (PII scrubbing, PyMuPDF extraction, Pydantic validation).
2. **Integration Tests:** API endpoints, mocked Gemini LLM interactions, and security header validation.
3. **E2E & Accessibility Checks:** Playwright-based WCAG audits, repository size limits, and keep-alive health checks.

---

## 2. Unit Testing

### Frontend (TypeScript)
- **PII Scrubber Validation:**
  - Tests that mock SSNs, names, phone numbers, emails, and credit card numbers are successfully replaced with `[REDACTED_SSN]`, `[REDACTED_NAME]`, etc., before the payload constructor.
- **Component Rendering:**
  - Validates that the dual-pane PDF viewer mounts without crashing.
  - Validates that UI overlays correctly map to the mathematically calculated `quads` provided by the backend.

### Backend (FastAPI / Pytest)
- **Pydantic Schema Validation:**
  - Ensures the `RiskAnalysis` and `ClauseRisk` models successfully parse valid JSON and explicitly reject malformed or missing fields.
- **PyMuPDF Geometry Logic (`test_pdf_processor.py`):**
  - Mocks a PDF document and verifies `page.search_for(exact_quote, quads=True)` returns accurate coordinates.
  - Tests the fallback state: Ensures the system falls back to prefix search (first 30 characters) if line-breaks cause an exact match miss.
  - Tests the graceful degradation state: Verifies the system returns empty geometry instead of crashing when a quote cannot be located.

---

## 3. Integration Testing

To preserve the Gemini API free-tier quota, **all automated integration tests MUST mock the generative AI engine.** Never hit the live Gemini API during local test suite runs or CI workflows.

- **Pipeline Execution (`test_api.py`):**
  - Sends a mocked text payload to `POST /api/v1/analyze/risk`.
  - Verifies the controller formats the prompt, parses the mock Gemini JSON, extracts coordinates, and returns a `200 OK`.
- **Rate Limiting (`test_limiter.py`):**
  - Triggers consecutive rapid requests to verify the `slowapi` token bucket successfully intercepts and returns `429 Too Many Requests` with the correct error message.
- **Security Headers (`test_security.py`):**
  - Verifies that all four enterprise security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are present on every response.
  - Validates that security headers are present even on `404` error responses.
  - Confirms the health endpoint includes `Cache-Control` headers for efficiency.
  - Validates the health endpoint returns the expected JSON structure.

---

## 4. Pre-Commit Checks

Before executing a `git commit`, the following constraints must be verified:

### Repository Size Check (< 10MB)
Run `git count-objects -vH` to ensure the `.git` directory and working tree are under the 10MB limit.
*Failure Condition:* Inclusion of `node_modules`, `venv`, `.pkl` files, or raw PDF templates.

### Accessibility (a11y) Audit
Run Playwright with `@axe-core/playwright` to run automated WCAG assertions, ensuring:
- All buttons and inputs have ARIA labels.
- The visual risk heatmap uses high-contrast text ratios for visually impaired users.
- The entire interface is navigable via `Tab` and `Enter` keyboard strokes.

### Cold-Start Keep-Alive Verification
Verify the frontend `setInterval` successfully pings `GET /api/v1/health` every 5 minutes in the production build to prevent Render's free-tier container from sleeping.

---

## 5. Required Checklist Before Merging Changes

- [ ] `npm test` passes for all frontend components and PII scrubbers.
- [ ] `pytest` passes for all backend routes, security headers, and PyMuPDF logic.
- [ ] Linter (`flake8`/`black` and `oxlint`) reports zero warnings or errors.
- [ ] No new `.env` variables or API keys have been committed.
- [ ] Total repository size remains strictly under 10MB.
- [ ] `API_SPEC.md` and `DATA_MODEL.md` have been updated if any payloads changed.
- [ ] The "Legal Disclaimer" remains prominently displayed on the UI.