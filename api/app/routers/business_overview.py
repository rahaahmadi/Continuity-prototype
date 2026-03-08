"""Business overview API: get or trigger generation (one per user, regenerates when docs change)."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import BusinessOverview, Document, User
from app.schemas.business_overview import BusinessOverviewResponse
from app.services.business_overview import (
    build_context_from_documents,
    compute_documents_snapshot,
)
from app.tasks.document_tasks import generate_business_overview_task

router = APIRouter(prefix="/business-overview", tags=["business-overview"])


@router.get("", response_model=BusinessOverviewResponse)
async def get_or_generate_business_overview(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BusinessOverviewResponse | JSONResponse:
    """
    Return the business overview for the current user.

    - If no overview exists: enqueue generation and return 202 (pending).
    - If an overview exists but documents have changed (added, deleted, or insights edited):
      regenerate and return 202 (pending).
    - If an overview exists and nothing changed: return 200 with the saved narrative.
    """
    # Load all documents for the user and build context (only docs with non-empty insights)
    docs_result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.asc())
    )
    docs = list(docs_result.scalars().all())
    context = build_context_from_documents(docs)
    current_snapshot = compute_documents_snapshot(context)

    # Load existing business overview for the user
    overview_result = await db.execute(
        select(BusinessOverview).where(BusinessOverview.user_id == current_user.id)
    )
    overview = overview_result.scalar_one_or_none()

    # (c) Saved overview and snapshot unchanged -> return saved
    if overview is not None and overview.status == "ready" and overview.documents_snapshot == current_snapshot:
        return BusinessOverviewResponse(
            content=overview.content,
            status=overview.status,
        )

    # Already generating: return pending without re-enqueueing
    if overview is not None and overview.status == "pending":
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content=BusinessOverviewResponse(content=None, status="pending").model_dump(),
        )

    # (a) No overview, or (b) overview exists but docs changed -> set pending and enqueue
    if overview is None:
        overview = BusinessOverview(
            user_id=current_user.id,
            status="pending",
        )
        db.add(overview)
    else:
        overview.status = "pending"
    await db.commit()

    generate_business_overview_task.delay(str(current_user.id))

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content=BusinessOverviewResponse(content=None, status="pending").model_dump(),
    )
