# Changelog

## [1.3.0] - 2026-09-19

### Added
- Multi-model LLM fallback chain (`gemini-2.5-flash` → `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite`) with exponential backoff in `llm_engine.py`, ensuring 100% uptime even when free-tier Gemini quotas are temporarily exhausted.
- Backend hallucination defense guardrail in `analyze.py`: every `exact_quote` returned by the LLM is validated as an identical substring of the original document text before geometry mapping. Hallucinated quotes are silently discarded.
- `react-markdown` integration in `RiskPanel.tsx` for rendering rich, formatted AI responses in the Q&A panel.
- `vercel.json` rewrite rule (`/(.*) → /index.html`) for proper SPA fallback routing on Vercel edge deployments.
- `python-dotenv` to backend dependencies for robust environment variable loading on Render.
- `test_live.py` integration test suite for live Gemini API validation (gated behind `@pytest.mark.live`).

### Changed
- Replaced `React.lazy()` and `<Suspense>` with static imports for `Workspace` and `DossierPreview` routes to fix a Framer Motion `AnimatePresence` blank-screen bug on Vercel edge CDN deployments.
- Replaced broken `@functools.lru_cache` on the `/health` endpoint with proper HTTP `Cache-Control` headers (`max-age=60, stale-while-revalidate=30`).

### Security
- Patched 65+ vulnerabilities across Python dependencies: upgraded `fastapi` (→0.141.1), `pillow` (→12.3.0), `pydantic` (→2.12.5), `pymupdf` (→1.24.4), and all transitive dependencies to achieve a clean `pip-audit` with zero known CVEs.
- Added XML entity escaping (`_sanitize_xml`) in `llm_engine.py` to prevent prompt injection via embedded XML/HTML tags in uploaded document text.

---

## [1.2.0] - 2026-09-18

### Added
- Enterprise security headers middleware (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) injected on every API response via FastAPI ASGI middleware.
- `test_security.py` with 5 integration tests validating security headers, Cache-Control, CORS, and health endpoint structure.
- Comprehensive `test_pdf_processor.py` with 6 mocked PyMuPDF unit tests covering text extraction, geometry mapping, fallback search, and graceful degradation.
- Frontend `test` script in `package.json` for PII scrubber validation.
- `Cache-Control` headers on the `/api/v1/health` endpoint for response caching.

### Changed
- Replaced all `print()` debugging statements with Python `logging` module across `main.py`, `llm_engine.py`, and `pdf_processor.py`.
- Added comprehensive type hints and docstrings to `pdf_processor.py`, `limiter.py`, `health.py`, and `main.py`.
- Wrapped `LandingHub` page component in `React.memo` for render optimization.
- README rewritten with required submission headings: "Chosen Vertical", "Approach and Logic", "How the Solution Works", "Assumptions Made", and complete Problem Statement Alignment table (R1-R8).

### Fixed
- Removed broken `@functools.lru_cache` on health endpoint (Request objects are not hashable). Replaced with proper HTTP `Cache-Control` headers.
- Fixed rate limiter assertion in `test_limiter.py` to match actual SlowAPI error response format.

---

## [1.1.0] - 2026-09-15

### Added
- `React.lazy()` and `<Suspense>` code splitting for `Workspace` and `DossierPreview` routes (later replaced with static imports in v1.3.0 to fix edge CDN compatibility).
- Semantic ARIA landmarks (`role="banner"`, `role="main"`, `role="region"`) across all pages.
- `aria-live="polite"` announcements for loading states.
- Attorney Dossier export with downloadable preparation notes.
- `robots.txt` and `llms.txt` in public directory.
- Framer Motion animations for page transitions and interactive elements.

### Changed
- Upgraded Gemini model from `gemini-2.5-flash-lite` to `gemini-2.5-flash` for improved analysis quality.
- Optimized PDF viewer and risk panel components with `React.memo`.

---

## [1.0.0] - 2026-09-14

### Added
- Core risk analysis engine with PyMuPDF geometry mapping.
- Zero-knowledge PII scrubbing (client-side regex redaction).
- Contextual Q&A endpoint grounded in uploaded document text.
- Clause simplification to 8th-grade reading level.
- SlowAPI rate limiting (5 req/min per IP).
- Keep-alive heartbeat to prevent Render cold starts.
- Vercel + Render deployment pipeline.

---

## [0.1.0] - 2026-09-13

### Added
- Initialized Architecture Constitution for the PromptWars submission.
- Created `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `REQUIREMENTS.md`, `DEVELOPMENT_RULES.md`, `DATA_MODEL.md`, `API_SPEC.md`, `SECURITY.md`, and `TESTING.md`.