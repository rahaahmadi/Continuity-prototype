"""Business overview: aggregate document insights and classifications via LLM."""

import hashlib
import json
from typing import Any

from langchain_openai import ChatOpenAI

from src.prompt_loader import get_prompt

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


def _has_meaningful_value(value: Any) -> bool:
    """Recursively determine whether a value contains meaningful extracted data."""
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple, set)):
        return any(_has_meaningful_value(item) for item in value)
    if isinstance(value, dict):
        return any(_has_meaningful_value(v) for v in value.values())
    return True


def _append_insight_lines(lines: list[str], key: str, value: Any, indent: int = 1) -> None:
    """Flatten nested insight structures into readable lines for prompting."""
    prefix = "  " * indent
    if value is None:
        return
    if isinstance(value, str):
        if value.strip():
            lines.append(f"{prefix}{key}: {value}")
        return
    if isinstance(value, dict):
        if not _has_meaningful_value(value):
            return
        lines.append(f"{prefix}{key}:")
        for sub_key, sub_value in value.items():
            _append_insight_lines(lines, str(sub_key), sub_value, indent + 1)
        return
    if isinstance(value, (list, tuple, set)):
        if not value:
            return
        lines.append(f"{prefix}{key}:")
        for item in value:
            if isinstance(item, dict):
                if _has_meaningful_value(item):
                    serialized = ", ".join(
                        f"{k}={v}" for k, v in item.items() if _has_meaningful_value(v)
                    )
                    if serialized:
                        lines.append(f"{prefix}  - {serialized}")
            elif isinstance(item, str):
                if item.strip():
                    lines.append(f"{prefix}  - {item}")
            elif _has_meaningful_value(item):
                lines.append(f"{prefix}  - {item}")
        return
    lines.append(f"{prefix}{key}: {value}")


def _insights_all_empty(insights: dict | None) -> bool:
    """Return True if insights is None or has no meaningful fields."""
    if not insights or not isinstance(insights, dict):
        return True
    return not _has_meaningful_value(insights)


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
        for key, value in insights.items():
            _append_insight_lines(block, key, value)
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
