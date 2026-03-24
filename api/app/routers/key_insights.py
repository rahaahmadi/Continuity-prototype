"""Key insights API: get or trigger generation (cached by documents snapshot)."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.key_insights import KeyInsightsResponse
from app.services.key_insights import get_or_generate_key_insights

router = APIRouter(prefix="/key-insights", tags=["key-insights"])


@router.get("", response_model=KeyInsightsResponse)
async def get_or_generate(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> KeyInsightsResponse | JSONResponse:
    """Return top key insights for the current user, regenerating if docs changed."""
    result = await get_or_generate_key_insights(current_user.id, db)
    if result.status == "ready":
        return KeyInsightsResponse(key_insights=result.key_insights, status=result.status)
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content=KeyInsightsResponse(key_insights=[], status="pending").model_dump(),
    )
