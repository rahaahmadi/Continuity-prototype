"""Document services: upload, list, get, summary, download, delete."""

import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Document
from app.tasks.document_tasks import (
    classify_document_task,
    generate_insights_task,
    summarize_document_task,
)

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def _upload_root() -> Path:
    root = Path(settings.upload_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _user_upload_dir(user_id: uuid.UUID) -> Path:
    path = _upload_root() / str(user_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


async def upload_document(
    user_id: uuid.UUID,
    filename: str,
    content_type: str,
    content: bytes,
    db: AsyncSession,
) -> Document:
    """Save file to disk, create Document, commit, enqueue classify and insights tasks. Raises ValueError if size exceeded."""
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"File too large (max {MAX_FILE_SIZE // (1024*1024)} MB)")
    safe_name = filename.strip().replace("..", "")
    stored_name = f"{safe_name}.{uuid.uuid4().hex}"
    user_dir = _user_upload_dir(user_id)
    stored_path = user_dir / stored_name
    stored_path.write_bytes(content)
    relative_path = f"{user_id}/{stored_name}"
    doc = Document(
        user_id=user_id,
        filename=filename.strip(),
        stored_path=relative_path,
        content_type=content_type,
        size_bytes=len(content),
        insights_status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    classify_document_task.delay(str(doc.id))
    generate_insights_task.delay(str(doc.id))
    return doc


async def list_documents(user_id: uuid.UUID, db: AsyncSession) -> list[Document]:
    """Return all documents for the user, newest first."""
    result = await db.execute(
        select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


async def get_document(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Document | None:
    """Return document by id if it belongs to user, else None."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_or_create_summary(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> tuple[str | None, str]:
    """
    Return (summary, status). If summary is ready, return (summary, "ready").
    If pending, return (None, "pending"). Otherwise set pending, enqueue task, return (None, "pending").
    Returns (None, "pending") with second element "pending" when enqueueing.
    """
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        return (None, "not_found")
    if doc.summary is not None and doc.summary.strip():
        return (doc.summary, "ready")
    if doc.summary_status == "pending":
        return (None, "pending")
    doc.summary_status = "pending"
    await db.commit()
    summarize_document_task.delay(str(doc.id))
    return (None, "pending")


async def download_document(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> tuple[Path, str, str] | None:
    """Return (full_path, filename, media_type) if document exists and file is present, else None."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        return None
    full_path = Path(settings.upload_dir).resolve() / doc.stored_path
    if not full_path.is_file():
        return None
    return (full_path, doc.filename or "document", doc.content_type or "application/octet-stream")


async def delete_document(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> bool:
    """Delete document and its file if it belongs to user. Return True if deleted, False if not found."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        return False
    full_path = Path(settings.upload_dir).resolve() / doc.stored_path
    full_path.unlink(missing_ok=True)
    await db.delete(doc)
    await db.commit()
    return True
