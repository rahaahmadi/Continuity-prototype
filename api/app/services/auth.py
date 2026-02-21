"""Password hashing and JWT creation/verification for auth."""

from datetime import datetime, timezone, timedelta
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.config import settings

BCRYPT_ROUNDS = 12


def hash_password(plain: str) -> str:
    """Hash a plain password for storage. Truncates to 72 bytes (bcrypt limit)."""
    raw = plain.encode("utf-8")
    if len(raw) > 72:
        raw = raw[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a stored hash."""
    raw = plain.encode("utf-8")
    if len(raw) > 72:
        raw = raw[:72]
    return bcrypt.checkpw(raw, hashed.encode("utf-8"))


def create_access_token(sub: UUID) -> tuple[str, int]:
    """Create a JWT access token for the given user id. Returns (token, expires_in_seconds)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(sub),
        "exp": expire,
        "type": "access",
    }
    token = jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    return token, settings.access_token_expire_minutes * 60


def decode_access_token(token: str) -> UUID | None:
    """Decode JWT and return user id (sub) if valid, else None."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        if payload.get("type") != "access":
            return None
        sub = payload.get("sub")
        if not sub:
            return None
        return UUID(sub)
    except JWTError:
        return None
