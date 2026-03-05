"""Classify document content into predefined categories using LangChain and an LLM."""

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings
from app.constants import DOCUMENT_CATEGORIES

CATEGORIES_LIST = "\n".join(f"- {c}" for c in DOCUMENT_CATEGORIES)

CLASSIFY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a document classifier for a business data room. "
            "Classify the given document content into exactly one of the following categories. "
            "Reply with only the category name, nothing else.\n\n"
            "Categories:\n{categories}",
        ),
        ("human", "Filename: {filename}\n\nContent (excerpt):\n{content}"),
    ]
)


def classify_document_text(text: str, filename: str = "") -> str | None:
    """
    Classify document text into one of DOCUMENT_CATEGORIES using the configured LLM.
    Returns the category string, or None if API key is missing or classification fails.
    """
    if not settings.openai_api_key:
        return None

    # Truncate content to avoid token limits (e.g. first ~8k chars)
    max_chars = 8000
    content = (text or "").strip()
    if len(content) > max_chars:
        content = content[:max_chars] + "\n\n[... truncated for classification ...]"
    if not content:
        content = "(No extractable text; using filename only.)"

    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0,
    )
    chain = CLASSIFY_PROMPT | llm | StrOutputParser()
    try:
        result = chain.invoke(
            {
                "categories": CATEGORIES_LIST,
                "filename": filename or "unknown",
                "content": content,
            }
        )
    except Exception:
        return None

    if not result:
        return None
    # Normalize: strip and match to allowed category (exact or best match)
    result = result.strip()
    for category in DOCUMENT_CATEGORIES:
        if result.upper() == category.upper():
            return category
    # If LLM returned something else, take first matching category that is a substring
    for category in DOCUMENT_CATEGORIES:
        if category.upper() in result.upper():
            return category
    return None
