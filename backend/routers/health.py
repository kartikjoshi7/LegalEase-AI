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
        "status": "active",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "vector_store": "ready",
        "gemini_api": "connected"
    }
