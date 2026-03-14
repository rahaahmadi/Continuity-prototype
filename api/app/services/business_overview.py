"""Business overview service: get or trigger generation."""

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BusinessOverview, Document
from app.tasks.document_tasks import generate_business_overview_task
from src.services.business_overview import (
    build_context_from_documents,
    compute_documents_snapshot,
)


@dataclass
class BusinessOverviewResult:
    content: str | None
    status: str  # "ready" | "pending"


async def get_or_generate_business_overview(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> BusinessOverviewResult:
    """
    If overview is ready and snapshot matches current docs, return (content, "ready").
    If overview is pending, return (None, "pending").
    Otherwise set overview to pending, enqueue task, return (None, "pending").
    """
    docs_result = await db.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.asc())
    )
    docs = list(docs_result.scalars().all())
    context = build_context_from_documents(docs)
    current_snapshot = compute_documents_snapshot(context)

    overview_result = await db.execute(
        select(BusinessOverview).where(BusinessOverview.user_id == user_id)
    )
    overview = overview_result.scalar_one_or_none()
    if overview is not None and overview.status == "ready" and overview.documents_snapshot == current_snapshot:
        return BusinessOverviewResult(content=overview.content, status="ready")

    if overview is not None and overview.status == "pending":
        return BusinessOverviewResult(content=None, status="pending")

    if overview is None:
        overview = BusinessOverview(user_id=user_id, status="pending")
        db.add(overview)
    else:
        overview.status = "pending"
        overview.content = None
    await db.commit()

    generate_business_overview_task.delay(str(user_id))
    return BusinessOverviewResult(content=None, status="pending")
