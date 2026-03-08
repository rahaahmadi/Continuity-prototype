"""Business overview: aggregate document insights and classifications into a narrative via LLM."""

import hashlib
import json
from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Document


def _insights_all_empty(insights: dict | None) -> bool:
    """Return True if insights is None or all list fields are empty."""
    if not insights or not isinstance(insights, dict):
        return True
    for v in insights.values():
        if isinstance(v, list) and v:
            return False
    return True


def get_insights_context_for_user(session: Session, user_id: Any) -> list[dict]:
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
        if _insights_all_empty(doc.insights):
            continue
        out.append({
            "document_id": str(doc.id),
            "filename": doc.filename or "",
            "classification": doc.classification or "",
            "insights": doc.insights or {},
        })
    return out


def compute_documents_snapshot(context: list[dict]) -> str:
    """
    Compute a deterministic hash from the context (doc id + insights) so we can
    detect when documents were added, removed, or insights changed.
    """
    items = sorted(
        (item["document_id"], json.dumps(item["insights"], sort_keys=True))
        for item in context
    )
    payload = json.dumps(items, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def build_context_from_documents(docs: list[Any]) -> list[dict]:
    """
    Build the same context list used for snapshot/LLM from an iterable of
    document-like objects (e.g. from async query) with .id, .filename,
    .classification, .insights. Skips documents with no or all-empty insights.
    """
    out = []
    for doc in docs:
        if _insights_all_empty(getattr(doc, "insights", None)):
            continue
        out.append({
            "document_id": str(doc.id),
            "filename": getattr(doc, "filename", None) or "",
            "classification": getattr(doc, "classification", None) or "",
            "insights": getattr(doc, "insights", None) or {},
        })
    return out


BUSINESS_OVERVIEW_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an expert business analyst preparing a business overview for M&A due diligence. "
        "You will receive structured insights and document classifications extracted from multiple "
        "company documents. Your task is to synthesize this information into a clear, coherent "
        "narrative overview of the business.\n\n"
        "Requirements:\n"
        "- Write concise paragraphs in professional prose. (not bullet points, not JSON)\n"
        "- Organize the narrative naturally around themes such as the company's operations, "
        "financial profile, customers and suppliers, products or services, workforce, and "
        "any notable risks or dependencies when supported by the information.\n"
        "- If the same fact appears in multiple documents, mention it only once.\n"
        "- Use only the information provided; do not invent or infer missing facts.\n"
        "- If certain aspects of the business are not described in the inputs, simply omit them.\n"
        "- Aim for clarity, neutrality, and completeness suitable for a due diligence summary."
    ),
    (
        "human",
        "Document insights and classifications:\n\n{context}\n\n"
        "Write a narrative business overview (several paragraphs) based on the above.",
    ),
])


def generate_business_overview_narrative(context: list[dict]) -> str:
    """
    Use the configured LLM to turn (insights + classification) per document into
    a single narrative business overview. Returns plain text paragraphs.
    """
    if not context:
        return (
            "No documents with extracted insights are available. "
            "Upload documents and wait for insights to be generated to create a business overview."
        )

    if not settings.openai_api_key:
        return (
            "LLM is not configured. Set OPENAI_API_KEY to generate a business overview."
        )

    # Build a readable context string for the LLM
    parts = []
    for i, item in enumerate(context, 1):
        classification = item.get("classification") or "Unclassified"
        filename = item.get("filename") or "Unknown"
        insights = item.get("insights") or {}
        block = [f"--- Document {i}: {filename} (Classification: {classification}) ---"]
        for key, values in insights.items():
            if isinstance(values, list) and values:
                block.append(f"  {key}:")
                for v in values:
                    block.append(f"    - {v}")
        parts.append("\n".join(block))
    context_str = "\n\n".join(parts)

    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0,
    )
    chain = BUSINESS_OVERVIEW_PROMPT | llm
    response = chain.invoke({"context": context_str})
    return (response.content or "").strip()
