# Development Rules & Architecture Constitution

## 1. Golden Rules for AI Assistants
This project (`LegalEase AI`) is built for a strict evaluation environment (Hack2skill PromptWars). You, the AI agent or developer, must strictly adhere to these rules before modifying any code. 
- **Do not invent APIs:** Always consult `API_SPEC.md` before changing request/response schemas.
- **Do not hallucinate coordinates:** Never attempt to predict or generate `[x1, y1, x2, y2]` spatial data from the LLM. You must use PyMuPDF's deterministic search function for visual anchors.
- **Do not break the budget:** Never introduce AWS, Google Cloud SQL, or paid-tier integrations. The system must operate completely free via Vercel, Render, and Gemini Free Tier.
- **Do not bloat the repository:** The final GitHub submission MUST remain under 10MB. Do not commit heavy assets (PDF templates or `.pkl` files).

## 2. Before Changing Code
1. Read `PROJECT_SPEC.md` to ensure the feature aligns with the prompt statement.
2. Read `ARCHITECTURE.md` to understand the boundary between Frontend (React) and Backend (FastAPI).
3. Inspect the existing implementation in the relevant module.
4. If a proposed change will increase the repository size significantly, flag it and provide a cloud-storage alternative.

## 3. Modification Rules

### LLM Integration (Gemini API)
- **Always use `response_schema`:** All Gemini 2.5 Flash calls MUST use Pydantic-enforced `response_schema` parameters. Do not rely on plain-text prompt engineering for JSON formatting.
- **Prompt Isolation:** Store system prompts in dedicated `.txt` or `.py` constant files. Do not inline massive prompts directly inside routing controllers.

### PDF & Coordinate Geometry
- **Use Quads, not Rects:** When extracting coordinates for the frontend PDF highlighter, always use `page.search_for(exact_quote, quads=True)`. Legal documents frequently contain rotated headers or skewed scans; quads provide geometrically honest bounds.
- **Text over Coordinates:** The LLM's only job is to return the exact string (`exact_quote`) of a risky clause. The FastAPI backend assumes total responsibility for translating that string into frontend bounding boxes. If `page.search_for` fails to find the exact quote, the system falls back to a prefix search (first 30 characters). If all matches fail, it returns empty geometry and continues serving the risk analysis — never crashing the request.

### Security & Privacy
- **Client-Side Scrubbing First:** Do not modify the frontend text extraction payload without ensuring the regex-based PII scrubber (which masks emails, SSNs, and names) is executed *before* the API request.
- **CORS Requirements:** The FastAPI backend MUST have a strict CORS policy allowing only the specific Vercel production deployment URL and `localhost` during development.

## 4. Before Completing a Task / Committing
1. **Run the Linter:** Ensure Python files comply with `flake8`/`black` and React files comply with `eslint`.
2. **Verify the Heartbeat:** Ensure the 5-minute keep-alive ping on the frontend has not been accidentally disabled (crucial for Render cold-start prevention).
3. **Verify the Limit:** Check the directory size to ensure you have not accidentally bundled `venv/` or `node_modules/` into the Git index.
4. **Update Documentation:** If you changed a JSON response structure, you MUST update `API_SPEC.md`.

## 5. Forbidden Actions
- `TODO` comments masquerading as implemented features.
- Ignoring or suppressing `PyMuPDF` or `google-genai` exception errors.
- Committing `.env` variables or API keys.
- Altering the "Legal Disclaimer" warning text on the frontend UI.