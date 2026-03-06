"""Document model: user-uploaded files stored on the server."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Document(Base):
    """A document uploaded by a user; file is stored on disk, metadata in DB."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(1024), nullable=False, unique=True)
    content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    # LLM classification into one of DOCUMENT_CATEGORIES (set by Celery task)
    classification: Mapped[str | None] = mapped_column(String(128), nullable=True)
    # LLM-generated summary (set by Celery task)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Summary state: none | pending | ready | failed
    summary_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="none", server_default="none"
    )
    # LLM-extracted structured insights (JSON); set by Celery task
    insights: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Insights state: none | pending | ready | failed
    insights_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="none", server_default="none"
    )

    def __repr__(self) -> str:
        return f"<Document id={self.id!r} user_id={self.user_id!r} filename={self.filename!r}>"
