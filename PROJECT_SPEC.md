# Project Specification: LegalEase AI

## Purpose
A zero-cost, high-accuracy legal document auditor and negotiation workbench designed to make legal information transparent, accessible, and actionable. It translates complex contracts into plain English and highlights asymmetrical liabilities without providing binding professional legal advice.

## Target Users
- Everyday consumers signing leases or service agreements.
- Freelancers navigating independent contractor agreements.
- Small and Medium Businesses (SMBs) lacking in-house legal counsel.

## Core Features
1. **Bilingual Jargon Simplifier & Grounded Q&A:** Deconstructs dense legal text into Plain English with deterministic, zero-hallucination text-anchor highlighting.
2. **Differential Contract Auditing:** Compares uploaded documents against standard statutory baselines to detect missing consumer protections and hidden obligations.
3. **Visual Risk Heatmap:** Assigns a Fair Contract Score and flags asymmetrical liabilities (e.g., uncapped indemnification, unilateral arbitration) using precise PyMuPDF document coordinate mapping.
4. **Counter-Draft Engine:** Auto-generates balanced, market-standard replacement clauses for flagged risks.
5. **Attorney Dossier Export:** Compiles an executive summary, chronological obligation checklist, and targeted questions to streamline formal legal counsel intake.

## Explicit Non-Goals
- **No Replacement of Professional Counsel:** The platform will strictly provide information and assistance, prominently featuring disclaimers that it does not replace professional legal advice.
- **No Paid Tiers or Billing:** Version 1 will operate entirely on free-tier infrastructure (Vercel, Render, Gemini API) to ensure zero operating costs.
- **No Database Hosting:** Will utilize a strictly stateless, in-memory architecture to avoid managed cloud database fees and maximize deployment speed.

## Constraints & Hack2Skill Evaluator Alignment
- **Repository Size:** The public GitHub repository MUST strictly remain under 10MB (exclude PDFs, binaries, and `node_modules`).
- **Submission Limits:** A maximum of 3 deployed submission attempts are allowed; robust local testing is mandatory.
- **Evaluation Criteria:** Must explicitly optimize for the AI Evaluator's rubric: Code Quality, Security (PII scrubbing), Efficiency, Testing, Accessibility (WCAG compliant), and Problem Statement Alignment.
- **Deterministic UI:** Generative AI will NOT predict bounding box coordinates. Gemini will return exact quote strings, which the backend will map to PDF coordinates via `PyMuPDF` to prevent visual UI drift.

## Definition of Done
A feature is considered complete only when:
- The implementation exists and satisfies the 10MB repository limit.
- AI-generated outputs match the strict Pydantic/JSON schema requirements.
- Client-side PII redacting functions correctly before data hits the backend.
- High-contrast toggles and keyboard navigation pass accessibility checks.
- The deployed Vercel/Render architecture responds cleanly without cold-start timeout failures.