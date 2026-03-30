"""Prepare tab chat: LLM-backed business Q&A and document upload coaching."""

import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.deps import get_current_user
from app.models import User
from app.schemas.prepare_chat import PrepareChatRequest, PrepareChatResponse
from src.constants import DOCUMENT_CATEGORIES
from src.services.prepare_chat import run_prepare_chat

router = APIRouter(prefix="/prepare-chat", tags=["prepare-chat"])


def _validate_category(active: str | None) -> None:
    if active is not None and active not in DOCUMENT_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid active_document_category",
        )


@router.post("", response_model=PrepareChatResponse)
async def prepare_chat_turn(
    body: PrepareChatRequest,
    _current_user: Annotated[User, Depends(get_current_user)],
) -> PrepareChatResponse:
    """Run one assistant turn for the Prepare chat (requires OpenAI)."""

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Prepare chat is not configured (missing OPENAI_API_KEY).",
        )

    if body.stage == "documents":
        _validate_category(body.active_document_category)

    pairs: list[tuple[str, str]] = [(m.role, m.content) for m in body.messages]

    try:
        text = await asyncio.to_thread(
            run_prepare_chat,
            pairs,
            stage=body.stage,
            active_document_category=body.active_document_category,
            openai_api_key=settings.openai_api_key,
            openai_model=settings.openai_model,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The assistant could not complete this request. Try again shortly.",
        ) from None

    return PrepareChatResponse(assistant_message=text)
