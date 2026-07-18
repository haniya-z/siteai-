"""
SiteAI — Authentication
JWT-based session auth, structured for OIDC/SSO upgrade path (Sprint 3+).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("auth")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


# ─── Password Utilities ───────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ─── JWT Utilities ────────────────────────────────────────────────────────────

def create_access_token(
    subject: str,
    extra_claims: dict = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        **(extra_claims or {}),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── FastAPI Dependency ───────────────────────────────────────────────────────

class CurrentUser:
    """Injected into protected routes via Depends(get_current_user)."""
    def __init__(self, user_id: str, email: str, role: str, org_id: str, project_id: str = None):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.org_id = org_id
        self.project_id = project_id


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> CurrentUser:
    if not credentials:
        # Dev mode: return demo user if no token provided
        if settings.debug:
            return CurrentUser(
                user_id="00000000-0000-0000-0000-000000000003",
                email="demo@siteai.dev",
                role="owner",
                org_id="00000000-0000-0000-0000-000000000001",
                project_id="00000000-0000-0000-0000-000000000002",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    return CurrentUser(
        user_id=payload.get("sub"),
        email=payload.get("email", ""),
        role=payload.get("role", "viewer"),
        org_id=payload.get("org_id", ""),
        project_id=payload.get("project_id"),
    )
