from fastapi import APIRouter
from datetime import datetime, timezone
from app.core.config import settings

router = APIRouter(tags=["health"])

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/")
async def root():
    return {
        "app": "SiteAI EPC Intelligence API",
        "version": "0.1.0",
        "docs": "/docs",
    }
