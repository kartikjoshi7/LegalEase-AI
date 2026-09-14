# Testing Strategy & Verification: LegalEase AI

## 1. Overview & AI Evaluator Alignment

To achieve a perfect score from the Hack2skill AI Evaluator, LegalEase AI relies on a stringent testing pipeline. Before any code is committed or merged, it must pass verification across Code Quality, Security, Efficiency, Accessibility, and Repository Constraints.

The testing pyramid is divided into:
1. **Unit Tests:** Core functions (PII scrubbing, PyMuPDF extraction, Pydantic validation).
2. **Integration Tests:** API endpoints and mocked Gemini LLM interactions.
3. **E2E & Evaluator Checks:** Accessibility audits, repository size limits, and keep-alive health checks.

---

## 2. Unit Testing Requirements

### Frontend (React / Jest)
- **PII Scrubber Validation (REQ-EVAL-001):** 
  - Must test that dummy SSNs, names, and phone numbers are successfully replaced with `[REDACTED_SSN]`, `[REDACTED_NAME]`, etc., before the payload constructor.
- **Component Rendering:** 
  - Verify that the dual-pane PDF viewer mounts without crashing.
  - Verify that UI overlays correctly map to the mathematically calculated `quads` provided by the backend.

### Backend (FastAPI / PyTest)
- **Pydantic Schema Validation:** 
  - Ensure the `RiskAnalysis` and `ClauseRisk` models successfully parse valid JSON and explicitly reject malformed or missing fields.
- **PyMuPDF Geometry Logic:**
  - Mock a PDF document and verify `page.search_for(exact_quote, quads=True)` returns accurate coordinates.
  - Test the failure state: Ensure the system throws a `422 GEOMETRY_MATCH_FAILED` error if the exact quote does not exist in the document.

---

## 3. Integration Testing Requirements

To preserve the Gemini API free-tier quota (15 RPM), **all automated integration tests MUST mock the generative AI engine.** Never hit the live Gemini API during local test suite runs or CI workflows.


- **Pipeline Execution:** 
  - Send a mocked text payload to `POST /api/v1/analyze/risk`.
  - Verify the controller formats the prompt, parses the mock Gemini JSON, extracts coordinates, and returns a `200 OK`.
- **Rate Limiting:** 
  - Trigger consecutive rapid requests to verify the `slowapi` token bucket successfully intercepts and returns `429 Too Many Requests`.

---

## 4. Evaluator-Specific Checks (Mandatory Pre-Commit)

Before executing a `git commit`, the following constraints must be manually or automatically verified:

### Repository Size Check (< 10MB)
Run `git count-objects -vH` to ensure the `.git` directory and working tree are under the 10MB limit. 
*Failure Condition:* Inclusion of `node_modules`, `venv`, `.pkl` files, or raw PDF templates.

### Accessibility (a11y) Audit
Run `npx @axe-core/cli` or use Chrome Lighthouse on the frontend to guarantee:
- All buttons and inputs have ARIA labels.
- The visual risk heatmap uses high-contrast text ratios for visually impaired users.
- The entire interface is navigable via `Tab` and `Enter` keyboard strokes.

### Cold-Start Keep-Alive Verification
Verify the frontend `setInterval` successfully pings `GET /api/v1/health` every 5 minutes in the production build to prevent Render's free-tier container from sleeping.

---

## 5. Required Checklist Before Merging Changes

- [ ] `npm test` passes for all frontend components and PII scrubbers.
- [ ] `pytest` passes for all backend routes and PyMuPDF logic.
- [ ] Linter (`flake8`/`black` and `eslint`) reports zero warnings or errors.
- [ ] No new `.env` variables or API keys have been committed.
- [ ] Total repository size remains strictly under 10MB.
- [ ] `API_SPEC.md` and `DATA_MODEL.md` have been updated if any payloads changed.
- [ ] The "Legal Disclaimer" remains prominently displayed on the UI.