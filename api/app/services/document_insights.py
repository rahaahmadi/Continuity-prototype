"""Extract structured M&A due diligence insights from documents using an LLM."""

import json
import re

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings

INSIGHTS_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert M&A due diligence analyst extracting structured insights "
            "from business documents.\n\n"
            "Extract key information relevant for business sale due diligence.\n"
            "Return ONLY valid JSON.\n\n"
            "{\n"
            '  "entities": [string],\n'
            '  "financial_values": [string],\n'
            '  "important_dates": [string],\n'
            '  "contracts_or_relationships": [string],\n'
            '  "operational_details": [string],\n'
            '  "risks": [string],\n'
            '  "notes": [string]\n'
            "}\n\n"
            "Only extract information explicitly present in the document.",
        ),
        ("human", "Document: {filename}\n\nContent:\n{content}"),
    ]
)

DEFAULT_INSIGHTS = {
    "entities": [],
    "financial_values": [],
    "important_dates": [],
    "contracts_or_relationships": [],
    "operational_details": [],
    "risks": [],
    "notes": [],
}


def _parse_insights_json(raw: str) -> dict:
    """Parse JSON from LLM output, optionally stripping markdown code blocks."""
    text = (raw or "").strip()
    # Remove optional markdown code fence
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    try:
        data = json.loads(text)
        if not isinstance(data, dict):
            return DEFAULT_INSIGHTS.copy()
        # Ensure all keys exist and are lists of strings
        result = DEFAULT_INSIGHTS.copy()
        for key in result:
            if key in data and isinstance(data[key], list):
                result[key] = [str(x) for x in data[key]]
        return result
    except (json.JSONDecodeError, TypeError):
        return DEFAULT_INSIGHTS.copy()


def extract_document_insights(text: str, filename: str = "") -> dict:
    """
    Extract structured insights from document text using the configured LLM.
    Returns a dict with entities, financial_values, important_dates, etc., or default empty structure on failure.
    """
    if not settings.openai_api_key:
        return DEFAULT_INSIGHTS.copy()

    max_chars = 12000
    content = (text or "").strip()
    if len(content) > max_chars:
        content = content[:max_chars] + "\n\n[... document truncated for insights ...]"
    if not content:
        content = "(No extractable text.)"

    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.2,
    )
    chain = INSIGHTS_PROMPT | llm | StrOutputParser()
    try:
        result = chain.invoke(
            {
                "filename": filename or "unknown",
                "content": content,
            }
        )
        return _parse_insights_json(result or "")
    except Exception:
        return DEFAULT_INSIGHTS.copy()
