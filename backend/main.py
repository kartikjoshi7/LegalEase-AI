from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from routers import health, analyze
from limiter import limiter

# Initialize Rate Limiter (Token Bucket for Gemini Quota Protection)

app = FastAPI(
    title="LegalEase AI API",
    description="Backend API for LegalEase AI - A Zero-Cost Legal Document Auditor",
    version="1.0.0"
)

# Set up Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration (Strictly restricted per SECURITY.md)
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

# Include Routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(analyze.router, prefix="/api/v1")
