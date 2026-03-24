"""Key insights: aggregate and rank top insights via LLM."""

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from src.prompt_loader import get_prompt

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_MAX_KEY_INSIGHTS = 4


class KeyInsight(BaseModel):
    """Single ranked key insight for the report overview."""

    title: str = Field(description="Short title of the insight")
    description: str = Field(description="One-line explanation of why it matters")


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
