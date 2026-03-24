"""Key insights service: get or trigger generation."""

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BusinessProfile, Document
from app.tasks.document_tasks import generate_key_insights_task
from src.services.business_overview import (
    build_context_from_documents,
    compute_documents_snapshot,
)


@dataclass
class KeyInsightsResult:
    key_insights: list[dict]
    status: str  # "ready" | "pending"


async def get_or_generate_key_insights(
    user_id: uuid.UUID,
    db: AsyncSession,
) -> KeyInsightsResult:
    """
    If key insights are ready and snapshot matches current docs, return cached insights.
    If pending, return pending.
    Otherwise set key insights to pending, enqueue task, return pending.
    """
    docs_result = await db.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.asc())
    )
    docs = list(docs_result.scalars().all())
    context = build_context_from_documents(docs)
    current_snapshot = compute_documents_snapshot(context)

    profile_result = await db.execute(
        select(BusinessProfile).where(BusinessProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()
    if (
        profile is not None
        and profile.key_insights_status == "ready"
        and profile.key_insights_documents_snapshot == current_snapshot
    ):
        return KeyInsightsResult(key_insights=profile.key_insights or [], status="ready")

    if profile is not None and profile.key_insights_status == "pending":
        return KeyInsightsResult(key_insights=[], status="pending")

    if profile is None:
        profile = BusinessProfile(user_id=user_id, key_insights_status="pending")
        db.add(profile)
    else:
        profile.key_insights_status = "pending"
        profile.key_insights = []
    await db.commit()

    generate_key_insights_task.delay(str(user_id))
    return KeyInsightsResult(key_insights=[], status="pending")
