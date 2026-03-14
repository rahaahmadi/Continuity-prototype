"""Document routes: upload (POST), list/get (GET), delete (DELETE)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, status, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas.document import DocumentListResponse, DocumentResponse, SummaryResponse
from app.services import documents as document_services

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


def _doc_to_response(doc) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        content_type=doc.content_type,
        size_bytes=doc.size_bytes,
        created_at=doc.created_at,
        classification=doc.classification,
        summary=doc.summary,
        summary_status=doc.summary_status,
        insights=doc.insights,
        insights_status=doc.insights_status,
    )


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
    chunks = []
    size = 0
    while chunk := await file.read(1024 * 64):
        size += len(chunk)
        if size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large (max {MAX_FILE_SIZE // (1024*1024)} MB)",
            )
        chunks.append(chunk)
    content = b"".join(chunks)
    try:
        doc = await document_services.upload_document(
            current_user.id,
            file.filename.strip(),
            content_type,
            content,
            db,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(e)) from e
    return _doc_to_response(doc)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DocumentListResponse:
    """List all documents for the current user."""
    docs = await document_services.list_documents(current_user.id, db)
    return DocumentListResponse(documents=[_doc_to_response(d) for d in docs])


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DocumentResponse:
    """Get document metadata by ID. User can only access their own documents."""
    doc = await document_services.get_document(document_id, current_user.id, db)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return _doc_to_response(doc)


@router.post("/{document_id}/summary", response_model=SummaryResponse)
async def get_or_create_summary(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SummaryResponse | JSONResponse:
    """Get the document summary, or enqueue generation and return pending."""
    summary, st = await document_services.get_or_create_summary(
        document_id, current_user.id, db
    )
    if st == "not_found":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if st == "ready" and summary is not None:
        return SummaryResponse(summary=summary, status="ready")
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content=SummaryResponse(summary=None, status="pending").model_dump(),
    )


@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Download the file for a document. User can only download their own documents."""
    result = await document_services.download_document(
        document_id, current_user.id, db
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    full_path, filename, media_type = result
    return FileResponse(path=full_path, filename=filename, media_type=media_type)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Delete a document and its file. User can only delete their own documents."""
    deleted = await document_services.delete_document(
        document_id, current_user.id, db
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return None
