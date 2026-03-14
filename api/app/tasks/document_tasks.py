"""Celery tasks for document processing (e.g. classification)."""

import uuid
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.celery_app import app
from app.config import settings
from app.database.sync_db import get_sync_session
from app.models import BusinessOverview, Document
from src.services.document_classifier import classify_document_text
from src.services.document_loader import extract_text_from_file
from src.services.document_insights import extract_document_insights
from src.services.document_summarizer import summarize_document_text
from src.services.business_overview import (
    compute_documents_snapshot,
    generate_business_overview_narrative,
)


def _get_insights_context_for_user(session: Session, user_id: Any) -> list[dict]:
    """
    Return list of dicts with document id, filename, classification, and insights
    for all documents that have non-empty insights. Ignores documents with no
    insights or all-empty insight fields.
    """
    result = session.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.asc())
    )
    docs = result.scalars().all()
    out = []
    for doc in docs:
        if not doc.insights or not isinstance(doc.insights, dict):
            continue
        if all(not v or (isinstance(v, list) and not v) for v in doc.insights.values()):
            continue
        out.append({
            "document_id": str(doc.id),
            "filename": doc.filename or "",
            "classification": doc.classification or "",
            "insights": doc.insights or {},
        })
    return out


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
        classification = classify_document_text(
            text,
            filename=doc.filename,
            openai_api_key=settings.openai_api_key,
            openai_model=settings.openai_model,
        )

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
        summary = summarize_document_text(
            text,
            filename=doc.filename,
            openai_api_key=settings.openai_api_key,
            openai_model=settings.openai_model,
        )

        doc.summary = summary
        doc.summary_status = "ready"
        session.commit()
        return {
            "ok": True,
            "document_id": document_id,
            "summary": summary,
        }
    except Exception as e:
        session.rollback()
        # Clear pending so user can retry after task failure
        try:
            res = session.execute(select(Document).where(Document.id == doc_uuid))
            d = res.scalar_one_or_none()
            if d is not None:
                d.summary_status = "failed"
                session.commit()
        except Exception:
            session.rollback()
        raise self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        session.close()


@app.task(bind=True, name="continuity.generate_insights")
def generate_insights_task(self, document_id: str) -> dict:
    """
    Extract text from the stored document, generate structured insights with the LLM, and save to the DB.
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
        insights = extract_document_insights(
            text,
            filename=doc.filename,
            openai_api_key=settings.openai_api_key,
            openai_model=settings.openai_model,
        )

        doc.insights = insights
        doc.insights_status = "ready"
        session.commit()
        return {
            "ok": True,
            "document_id": document_id,
            "insights": insights,
        }
    except Exception as e:
        session.rollback()
        try:
            res = session.execute(select(Document).where(Document.id == doc_uuid))
            d = res.scalar_one_or_none()
            if d is not None:
                d.insights_status = "failed"
                session.commit()
        except Exception:
            session.rollback()
        raise self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        session.close()


@app.task(bind=True, name="continuity.generate_business_overview")
def generate_business_overview_task(self, user_id: str) -> dict:
    """
    For the given user, gather all document insights and classifications,
    generate a narrative business overview with the LLM, and save it to BusinessOverview.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        return {"ok": False, "error": "invalid_user_id", "user_id": user_id}

    session = get_sync_session()
    try:
        context = _get_insights_context_for_user(session, user_uuid)
        snapshot = compute_documents_snapshot(context)
        narrative = generate_business_overview_narrative(
            context,
            openai_api_key=settings.openai_api_key,
            openai_model=settings.openai_model,
        )

        result = session.execute(
            select(BusinessOverview).where(BusinessOverview.user_id == user_uuid)
        )
        overview = result.scalar_one_or_none()
        if overview is None:
            overview = BusinessOverview(user_id=user_uuid)
            session.add(overview)

        overview.content = narrative
        overview.status = "ready"
        overview.documents_snapshot = snapshot
        session.commit()
        return {
            "ok": True,
            "user_id": user_id,
            "status": "ready",
            "documents_snapshot": snapshot,
        }
    except Exception as e:
        session.rollback()
        try:
            res = session.execute(
                select(BusinessOverview).where(BusinessOverview.user_id == user_uuid)
            )
            ob = res.scalar_one_or_none()
            if ob is not None:
                ob.status = "failed"
                session.commit()
        except Exception:
            session.rollback()
        raise self.retry(exc=e, countdown=60, max_retries=3)
    finally:
        session.close()
