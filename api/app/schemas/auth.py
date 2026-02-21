"""Request/response schemas for auth (register, login)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Body for POST /auth/register."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (8–128 characters)",
    )

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class RegisterResponse(BaseModel):
    """Response after successful registration."""

    id: UUID
    email: str
    message: str = "Registration successful. You can now log in."


class LoginRequest(BaseModel):
    """Body for POST /auth/login."""

    email: EmailStr
    password: str


class TokenPayload(BaseModel):
    """JWT payload (sub = user id, exp, etc.)."""

    sub: str  # user id (uuid string)
    exp: datetime
    type: str = "access"


class LoginResponse(BaseModel):
    """Response after successful login: access token + user info for redirect."""

    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: "UserResponse"


class UserResponse(BaseModel):
    """Public user info returned in login and me endpoints."""

    id: UUID
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


LoginResponse.model_rebuild()
