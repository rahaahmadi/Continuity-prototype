"""Generate document summaries using LangChain and an LLM."""

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"

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
