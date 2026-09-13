from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routers import health
from services.vector_store import initialize_vector_store

# Initialize Rate Limiter (Token Bucket for Gemini Quota Protection)
limiter = Limiter(key_func=get_remote_address, default_limits=["5/minute"])

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
    "https://legalease-ai.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Event
@app.on_event("startup")
async def startup_event():
    # Initialize the ephemeral ChromaDB vector store
    initialize_vector_store()

# Include Routers
app.include_router(health.router, prefix="/api/v1")
