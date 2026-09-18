"""
Main application entry point for the LegalEase AI backend.

Configures the FastAPI application with enterprise-grade security middleware,
strict CORS policies, IP-based rate limiting, and modular RESTful routing
for legal document analysis services.
"""
from dotenv import load_dotenv
load_dotenv()

import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from routers import health, analyze
from limiter import limiter

# Configure structured logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("legalease")

# Initialize FastAPI Application
app = FastAPI(
    title="LegalEase AI API",
    description="Backend API for LegalEase AI — An AI-powered legal document auditor that simplifies complex legal documents, highlights important clauses and risks, answers questions based on provided legal documents, and generates actionable outputs to help users prepare for legal professionals.",
    version="1.0.0"
)

# ============================================================
# Security Headers Middleware
# Injects enterprise security headers on every API response
# to prevent XSS, clickjacking, and MIME sniffing attacks.
# ============================================================
@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:
    """Inject security headers into every outbound HTTP response."""
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

# ============================================================
# Rate Limiter Configuration (Token Bucket for Gemini Quota Protection)
# ============================================================
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================================
# CORS Configuration (Strictly restricted per SECURITY.md)
# ============================================================
origins = [
    "https://legal-ease-ai-snowy.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# ============================================================
# Router Registration
# ============================================================
app.include_router(health.router, prefix="/api/v1")
app.include_router(analyze.router, prefix="/api/v1")

logger.info("LegalEase AI backend initialized successfully.")
