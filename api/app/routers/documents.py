"""Document routes: upload (POST), list/get (GET), delete (DELETE)."""

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, status, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Document, User
from app.schemas.document import DocumentListResponse, DocumentResponse
from app.tasks.document_tasks import classify_document_task

router = APIRouter(prefix="/documents", tags=["documents"])

# Max file size (e.g. 50 MB)
MAX_FILE_SIZE = 50 * 1024 * 1024


def _upload_root() -> Path:
    """Root directory for uploads; create if missing."""
    root = Path(settings.upload_dir).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _user_upload_dir(user_id: uuid.UUID) -> Path:
    """Per-user upload directory."""
    root = _upload_root()
    path = root / str(user_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
) -> DocumentResponse:
    """Upload a document. File is saved on the server and metadata stored in DB."""
    if not file.filename or file.filename.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )
    content_type = file.content_type or "application/octet-stream"
    size = 0
    user_dir = _user_upload_dir(current_user.id)
    # Store as original_name.uuid to avoid collisions and path traversal
    safe_name = file.filename.strip().replace("..", "")
    stored_name = f"{safe_name}.{uuid.uuid4().hex}"
    stored_path = user_dir / stored_name
    try:
        with open(stored_path, "wb") as f:
            while chunk := await file.read(1024 * 64):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    stored_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File too large (max {MAX_FILE_SIZE // (1024*1024)} MB)",
                    )
                f.write(chunk)
    except HTTPException:
        raise
    except OSError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file",
        ) from e

    # Relative path for DB: user_id/stored_name (portable across server moves)
    relative_path = f"{current_user.id}/{stored_name}"
    doc = Document(
        user_id=current_user.id,
        filename=file.filename.strip(),
        stored_path=relative_path,
        content_type=content_type,
        size_bytes=size,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    classify_document_task.delay(str(doc.id))
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        content_type=doc.content_type,
        size_bytes=doc.size_bytes,
        created_at=doc.created_at,
        classification=doc.classification,
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DocumentListResponse:
    """List all documents for the current user."""
    result = await db.execute(
        select(Document).where(Document.user_id == current_user.id).order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return DocumentListResponse(
        documents=[
            DocumentResponse(
                id=d.id,
                filename=d.filename,
                content_type=d.content_type,
                size_bytes=d.size_bytes,
                created_at=d.created_at,
                classification=d.classification,
            )
            for d in docs
        ]
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DocumentResponse:
    """Get document metadata by ID. User can only access their own documents."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        content_type=doc.content_type,
        size_bytes=doc.size_bytes,
        created_at=doc.created_at,
        classification=doc.classification,
    )


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Download the file for a document. User can only download their own documents."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    full_path = Path(settings.upload_dir).resolve() / doc.stored_path
    if not full_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")
    return FileResponse(
        path=full_path,
        filename=doc.filename,
        media_type=doc.content_type,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a document and its file. User can only delete their own documents."""
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    full_path = Path(settings.upload_dir).resolve() / doc.stored_path
    full_path.unlink(missing_ok=True)
    await db.delete(doc)
    return None