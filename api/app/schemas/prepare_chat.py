"""Request/response schemas for Prepare chat API."""

from typing import Literal

from pydantic import BaseModel, Field


class PrepareChatMessageDTO(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class PrepareChatRequest(BaseModel):
    messages: list[PrepareChatMessageDTO] = Field(..., min_length=0)
    stage: Literal["business", "documents"]
    active_document_category: str | None = None


class PrepareChatResponse(BaseModel):
    assistant_message: str
