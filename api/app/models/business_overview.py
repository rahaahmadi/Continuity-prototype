"""Business overview model: one per user, narrative generated from document insights."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class BusinessOverview(Base):
    """
    One business overview per user. Narrative text generated from all document
    insights and classifications. documents_snapshot is a hash used to detect
    when documents have changed (add/delete/edit) so we know whether to regenerate.
    """

    __tablename__ = "business_overviews"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    # none | pending | ready | failed
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="none", server_default="none"
    )
    # Hash of (doc ids + insights) to detect document set/content changes
    documents_snapshot: Mapped[str | None] = mapped_column(String(128), nullable=True)
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
        return f"<BusinessOverview user_id={self.user_id!r} status={self.status!r}>"
