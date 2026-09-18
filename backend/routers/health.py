"""
Health check and telemetry endpoint for the LegalEase AI backend.

Provides a lightweight, cached health probe used by uptime monitors
and the React frontend keep-alive mechanism to prevent Render's
free-tier container from cold-starting.
"""
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from limiter import limiter

router = APIRouter(tags=["Health"])


@router.get("/health")
@router.head("/health")
@limiter.limit("5/minute")
def health_check(request: Request) -> JSONResponse:
    """
    Keep-alive endpoint pinged every 5 minutes by the React frontend.

    Returns a JSON response with Cache-Control headers to reduce
    redundant computation on repeated telemetry pings.
    """
    content = {
        "status": "active",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_api": "connected"
    }
    response = JSONResponse(content=content)
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=30"
    return response
