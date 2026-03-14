"""Generate document summaries using LangChain and an LLM."""

from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

from src.prompt_loader import get_prompt

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


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
        return (result or "").strip() or None
    except Exception:
        return None
