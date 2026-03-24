"""Business overview: aggregate document insights and classifications via LLM."""

import hashlib
import json
from typing import Any

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from src.prompt_loader import get_prompt

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_MAX_KEY_INSIGHTS = 5


class KeyInsight(BaseModel):
    """Single ranked key insight for the report overview."""

    title: str = Field(description="Short title of the insight")
    description: str = Field(description="One-line explanation of why it matters")


class KeyInsightsResult(BaseModel):
    """Top ranked insights synthesized from all processed documents."""

    insights: list[KeyInsight] = Field(default_factory=list)


def _insights_all_empty(insights: dict | None) -> bool:
    """Return True if insights is None or all list fields are empty."""
    if not insights or not isinstance(insights, dict):
        return True
    for v in insights.values():
        if isinstance(v, list) and v:
            return False
    return True


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


def generate_business_overview_narrative(
    context: list[dict],
    *,
    openai_api_key: str | None = None,
    openai_model: str = DEFAULT_OPENAI_MODEL,
) -> str:
    """
    Use the LLM to turn (insights + classification) per document into
    a single narrative business overview. Returns a Markdown-formatted string.
    """
    if not context:
        return (
            "No documents with extracted insights are available. "
            "Upload documents and wait for insights to be generated to create a business overview."
        )

    if not openai_api_key:
        return (
            "LLM is not configured. Set OPENAI_API_KEY to generate a business overview."
        )

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
        model=openai_model,
        api_key=openai_api_key,
        temperature=0,
    )
    chain = get_prompt("business_overview") | llm
    response = chain.invoke({"context": context_str})
    return (response.content or "").strip()


def generate_top_key_insights(
    context: list[dict],
    *,
    openai_api_key: str | None = None,
    openai_model: str = DEFAULT_OPENAI_MODEL,
    max_items: int = DEFAULT_MAX_KEY_INSIGHTS,
) -> list[dict]:
    """
    Generate and rank cross-document key insights.

    Returns up to max_items entries, each with `title` and one-line `description`.
    """
    if not context or max_items <= 0 or not openai_api_key:
        return []

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
        model=openai_model,
        api_key=openai_api_key,
        temperature=0,
    )
    structured_llm = llm.with_structured_output(KeyInsightsResult)
    chain = get_prompt("top_key_insights") | structured_llm
    try:
        result: KeyInsightsResult = chain.invoke(
            {
                "context": context_str,
                "max_items": max_items,
            }
        )
    except Exception:
        return []

    clean_insights: list[dict] = []
    for item in result.insights:
        title = (item.title or "").strip()
        description = " ".join((item.description or "").split())
        if title and description:
            clean_insights.append({"title": title, "description": description})
        if len(clean_insights) >= max_items:
            break
    return clean_insights
