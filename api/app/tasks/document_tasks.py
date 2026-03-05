"""Celery tasks for document processing (e.g. classification)."""

import uuid
from pathlib import Path

from sqlalchemy import select

from app.celery_app import app
from app.config import settings
from app.database_sync import get_sync_session
from app.models import Document
from app.services.document_classifier import classify_document_text
from app.services.document_loader import extract_text_from_file
from app.services.document_summarizer import summarize_document_text


@app.task(bind=True, name="continuity.classify_document")
def classify_document_task(self, document_id: str) -> dict:
    """
    Extract text from the stored document, classify it with the LLM, and update the document's classification in the DB.
    """
    try:
        doc_uuid = uuid.UUID(document_id)
    except (ValueError, TypeError):
        return {"ok": False, "error": "invalid_document_id", "document_id": document_id}

    session = get_sync_session()
    try:
        result = session.execute(select(Document).where(Document.id == doc_uuid))
        doc = result.scalar_one_or_none()
        if doc is None:
            return {"ok": False, "error": "document_not_found", "document_id": document_id}

        full_path = Path(settings.upload_dir).resolve() / doc.stored_path
        text = extract_text_from_file(full_path, doc.content_type)
        classification = classify_document_text(text, filename=doc.filename)

        doc.classification = classification
        session.commit()
        return {
            "ok": True,
            "document_id": document_id,
            "classification": classification,
        }
    except Exception as e:
        session.rollback()
        raise self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        session.close()


@app.task(bind=True, name="continuity.summarize_document")
def summarize_document_task(self, document_id: str) -> dict:
    """
    Extract text from the stored document, summarize it with the LLM, and update the document's summary in the DB.
    """
    try:
        doc_uuid = uuid.UUID(document_id)
    except (ValueError, TypeError):
        return {"ok": False, "error": "invalid_document_id", "document_id": document_id}

    session = get_sync_session()
    try:
        result = session.execute(select(Document).where(Document.id == doc_uuid))
        doc = result.scalar_one_or_none()
        if doc is None:
            return {"ok": False, "error": "document_not_found", "document_id": document_id}

        full_path = Path(settings.upload_dir).resolve() / doc.stored_path
        text = extract_text_from_file(full_path, doc.content_type)
        summary = summarize_document_text(text, filename=doc.filename)

        doc.summary = summary
        session.commit()
        return {
            "ok": True,
            "document_id": document_id,
            "summary": summary,
        }
    except Exception as e:
        session.rollback()
        raise self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        session.close()
