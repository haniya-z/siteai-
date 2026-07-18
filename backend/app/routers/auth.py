from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.core.auth import create_access_token, verify_password
from app.core.logging import get_logger

logger = get_logger("router.auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Demo credentials (replace with DB lookup in production)
DEMO_USERS = {
    "demo@siteai.dev": {
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj0bN4yT1g5.",
        "full_name": "Demo Engineer",
        "role": "owner",
        "org_id": "00000000-0000-0000-0000-000000000001",
        "project_id": "00000000-0000-0000-0000-000000000002",
        "user_id": "00000000-0000-0000-0000-000000000003",
    }
}

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = DEMO_USERS.get(request.email)
    # Demo mode: accept password "demo123" or verify hash
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # For demo: accept "demo123" directly
    password_ok = request.password == "demo123" or verify_password(request.password, user["hashed_password"])
    if not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(
        subject=user["user_id"],
        extra_claims={
            "email": request.email,
            "role": user["role"],
            "org_id": user["org_id"],
            "project_id": user["project_id"],
        },
    )
    return TokenResponse(
        access_token=token,
        user={
            "user_id": user["user_id"],
            "email": request.email,
            "full_name": user["full_name"],
            "role": user["role"],
        },
    )

@router.post("/demo-token")
async def demo_token():
    """Returns a demo token without credentials — for hackathon demos."""
    user = DEMO_USERS["demo@siteai.dev"]
    token = create_access_token(
        subject=user["user_id"],
        extra_claims={
            "email": "demo@siteai.dev",
            "role": user["role"],
            "org_id": user["org_id"],
            "project_id": user["project_id"],
        },
    )
    return {"access_token": token, "token_type": "bearer"}
