from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "data": {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    }
