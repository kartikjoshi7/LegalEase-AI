from fastapi import APIRouter, Request
from datetime import datetime, timezone
from limiter import limiter

router = APIRouter(tags=["Health"])

@router.get("/health")
@router.head("/health")
@limiter.limit("5/minute")
async def health_check(request: Request):
    """
    Keep-alive endpoint pinged every 5 minutes by the React frontend 
    to prevent the Render free-tier container from cold-starting.
    """
    return {
        "status": "active",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_api": "connected"
    }
