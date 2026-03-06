"""Generate document summaries using LangChain and an LLM."""

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings

SUMMARY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert business document summarizer. "
            "Write a clear and concise summary of the document. "
            "Focus on the most important facts, figures, entities, obligations, and decisions. Keep the summary under 250 words.",
        ),
        ("human", "Document: {filename}\n\nContent:\n{content}"),
    ]
)


def summarize_document_text(text: str, filename: str = "") -> str | None:
    """
    Summarize document text using the configured LLM.
    Returns the summary string, or None if API key is missing or summarization fails.
    """
    if not settings.openai_api_key:
        return None

    # Truncate to avoid token limits (e.g. ~12k chars for input)
    max_chars = 12000
    content = (text or "").strip()
    if len(content) > max_chars:
        content = content[:max_chars] + "\n\n[... document truncated for summarization ...]"
    if not content:
        content = "(No extractable text.)"

    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.2,
    )
    chain = SUMMARY_PROMPT | llm | StrOutputParser()
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
