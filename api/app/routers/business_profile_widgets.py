"""Business profile widgets API."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.business_profile_widgets import BusinessProfileWidgetsResponse
from app.services.business_profile_widgets import get_business_profile_widgets

router = APIRouter(prefix="/business-profile/widgets", tags=["business-profile-widgets"])


@router.get("", response_model=BusinessProfileWidgetsResponse)
async def get_widgets(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BusinessProfileWidgetsResponse:
    result = await get_business_profile_widgets(current_user.id, db)
    return BusinessProfileWidgetsResponse(
        status=result.status,
        readiness_score=result.readiness_score,
        readiness_completed_checks=result.readiness_completed_checks,
        readiness_total_checks=result.readiness_total_checks,
        business_snapshot=result.business_snapshot,
        revenue_trend_points=result.revenue_trend_points,
        financial_highlights=result.financial_highlights,
        customer_concentration=result.customer_concentration,
    )

