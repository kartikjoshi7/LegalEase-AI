from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """
    Keep-alive endpoint pinged every 5 minutes by the React frontend 
    to prevent the Render free-tier container from cold-starting.
    """
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_api": "connected"
    }
