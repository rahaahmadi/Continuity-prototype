"""Key insights: aggregate and rank top insights via LLM."""

from typing import Literal

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from src.prompt_loader import get_prompt

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_MAX_KEY_INSIGHTS = 4
ALLOWED_KEY_INSIGHT_KINDS = {
    "growth",
    "risk",
    "financial",
    "operations",
    "customer",
    "team",
    "compliance",
    "opportunity",
    "other",
}


def _has_meaningful_value(value) -> bool:
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


def _append_insight_lines(lines: list[str], key: str, value, indent: int = 1) -> None:
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


class KeyInsight(BaseModel):
    """Single ranked key insight for the report overview."""

    title: str = Field(description="Short title of the insight")
    description: str = Field(description="One-line explanation of why it matters")
    kind: Literal[
        "growth",
        "risk",
        "financial",
        "operations",
        "customer",
        "team",
        "compliance",
        "opportunity",
        "other",
    ] = Field(description="Semantic category used by frontend to pick icon/color")


class KeyInsightsResult(BaseModel):
    """Top ranked insights synthesized from all processed documents."""

    insights: list[KeyInsight] = Field(default_factory=list)


def generate_top_key_insights(
    context: list[dict],
    *,
    openai_api_key: str | None = None,
    openai_model: str = DEFAULT_OPENAI_MODEL,
    max_items: int = DEFAULT_MAX_KEY_INSIGHTS,
) -> list[dict]:
    """
    Generate and rank cross-document key insights.

    Returns up to max_items entries, each with `title`, `description`, and `kind`.
    """
    if not context or max_items <= 0 or not openai_api_key:
        return []

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
        kind = (item.kind or "other").strip().lower()
        if kind not in ALLOWED_KEY_INSIGHT_KINDS:
            kind = "other"
        if title and description:
            clean_insights.append(
                {
                    "title": title,
                    "description": description,
                    "kind": kind,
                }
            )
        if len(clean_insights) >= max_items:
            break
    return clean_insights
