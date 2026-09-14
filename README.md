# ⚖️ LegalEase AI

**LegalEase AI** is an institutional-grade document auditor and negotiation workbench that translates complex contracts into plain English. Built for the **Hack2skill PromptWars 2026 Virtual (Exclusive Edition)**, this platform addresses the asymmetry in contract negotiations by providing zero-hallucination risk analysis, statutory diffing, and actionable attorney dossiers.

## ✨ Core Features
* **Zero-Hallucination Highlighting:** Uses the Gemini API for semantic reasoning and deterministic PyMuPDF math for exact document coordinate mapping.
* **Client-Side PII Scrubbing:** All sensitive data (names, SSNs, addresses) is redacted locally before hitting the backend APIs.
* **Visual Risk Heatmap:** Automatically flags asymmetrical liabilities (e.g., uncapped indemnification, unilateral arbitration) and generates market-standard counter-drafts.
* **Attorney Dossier Export:** Compiles identified risks and plain-English summaries into a structured intake brief for professional legal counsel.

## 🛠 Tech Stack (Zero-Cost Architecture)
* **Frontend:** React (Vercel Free Tier)
* **Backend:** Python / FastAPI (Render Free Web Service)
* **Generative AI:** Google Gemini API (`gemini-2.5-flash-lite`)
* **Document Processing:** PyMuPDF (`fitz`)

## 📚 Engineering Contracts (Vibe Coding)
This repository is strictly governed by living markdown contracts designed to maximize the AI Evaluator's Code Quality, Security, and Efficiency scores. Review these before modifying code:
* `PROJECT_SPEC.md`: Core product definition and non-goals.
* `ARCHITECTURE.md`: High-level system design and component responsibilities.
* `REQUIREMENTS.md`: Functional constraints and AI Evaluator alignment.
* `DEVELOPMENT_RULES.md`: Mandatory instructions for AI/Vibe coders.
* `API_SPEC.md`: REST API contracts, headers, and standard error responses.
* `DATA_MODEL.md`: Pydantic schema constraints and Firestore collections.
* `SECURITY.md`: Threat model, PII scrubbing logic, and JWT validation.
* `TESTING.md`: Mandatory pre-commit checks and repository size validations.

## 🚀 Local Development

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the FastAPI development server
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start the React development server
npm run dev
```

## ⚠️ Legal Disclaimer
**LegalEase AI is an informational analysis tool and does not provide legal advice, representation, or formal legal opinions. Use of this application does not create an attorney-client relationship. Always consult a qualified attorney for specific legal matters.**