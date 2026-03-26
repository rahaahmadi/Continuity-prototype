"""Generate document summaries using LangChain and an LLM."""

from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

from src.prompt_loader import get_prompt

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


def _normalize_markdown_summary(summary: str) -> str:
    """Normalize LLM output into clean markdown text."""
    cleaned = (summary or "").strip()
    if not cleaned:
        return ""

    # Handle escaped newlines returned as literal \n.
    cleaned = cleaned.replace("\\r\\n", "\n").replace("\\n", "\n")
    cleaned = cleaned.replace("\r\n", "\n").strip()

    # If model wraps markdown in fenced blocks, unwrap it.
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if len(lines) >= 3 and lines[-1].strip() == "```":
            cleaned = "\n".join(lines[1:-1]).strip()

    return cleaned


def summarize_document_text(
    text: str,
    filename: str = "",
    *,
    openai_api_key: str | None = None,
    openai_model: str = DEFAULT_OPENAI_MODEL,
) -> str | None:
    """
    Summarize document text using the LLM.
    Returns the summary string, or None if API key is missing or summarization fails.
    """
    if not openai_api_key:
        return None

    max_chars = 12000
    content = (text or "").strip()
    if len(content) > max_chars:
        content = content[:max_chars] + "\n\n[... document truncated for summarization ...]"
    if not content:
        content = "(No extractable text.)"

    llm = ChatOpenAI(
        model=openai_model,
        api_key=openai_api_key,
        temperature=0.2,
    )
    chain = get_prompt("document_summarizer") | llm | StrOutputParser()
    try:
        result = chain.invoke(
            {
                "filename": filename or "unknown",
                "content": content,
            }
        )
        normalized = _normalize_markdown_summary(result or "")
        return normalized or None
    except Exception:
        return None
