"""Request/response schemas for documents (upload, list, get)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    """Document metadata returned in list and get endpoints."""

    id: UUID
    filename: str
    content_type: str
    size_bytes: int
    created_at: datetime
    classification: str | None = None

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    """List of documents for GET /documents."""

    documents: list[DocumentResponse] = Field(default_factory=list)
