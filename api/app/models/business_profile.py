"""Business profile model: parent container for generated reports."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BusinessProfile(Base):
    """
    One business profile per user, containing report artifacts generated from
    document insights (business overview, key insights, and future reports).
    """

    __tablename__ = "business_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )

    # Business overview report
    business_overview_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_overview_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="none", server_default="none"
    )
    business_overview_documents_snapshot: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )

    # Key insights report
    key_insights: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    key_insights_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="none", server_default="none"
    )
    key_insights_documents_snapshot: Mapped[str | None] = mapped_column(
        String(128), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<BusinessProfile user_id={self.user_id!r}>"
