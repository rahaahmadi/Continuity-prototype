"""Business overview API: get or trigger generation (one per user, regenerates when docs change)."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.business_overview import BusinessOverviewResponse
from app.services.business_overview import get_or_generate_business_overview

router = APIRouter(prefix="/business-overview", tags=["business-overview"])


@router.get("", response_model=BusinessOverviewResponse)
async def get_or_generate(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BusinessOverviewResponse | JSONResponse:
    """
    Return the business overview for the current user.
    If ready and up to date: 200 with content. If pending or enqueued: 202.
    """
    result = await get_or_generate_business_overview(current_user.id, db)
    if result.status == "ready":
        return BusinessOverviewResponse(
            content=result.content,
            status=result.status,
        )
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content=BusinessOverviewResponse(
            content=None,
            key_insights=[],
            status="pending",
        ).model_dump(),
    )
