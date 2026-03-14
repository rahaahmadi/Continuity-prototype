"""Classify document content into predefined categories using LangChain and an LLM."""

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from src.constants import DOCUMENT_CATEGORIES

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


def _categories_list(categories: list[str] | None = None) -> str:
    cats = categories or DOCUMENT_CATEGORIES
    return "\n".join(f"- {c}" for c in cats)


def classify_document_text(
    text: str,
    filename: str = "",
    *,
    openai_api_key: str | None = None,
    openai_model: str = DEFAULT_OPENAI_MODEL,
    categories: list[str] | None = None,
) -> str | None:
    """
    Classify document text into one of the given categories using the LLM.
    Returns the category string, or None if API key is missing or classification fails.
    """
    if not openai_api_key:
        return None

    cats = categories or DOCUMENT_CATEGORIES
    content = (text or "").strip()
    max_chars = 8000
    if len(content) > max_chars:
        content = content[:max_chars] + "\n\n[... truncated for classification ...]"
    if not content:
        content = "(No extractable text; using filename only.)"

    prompt = ChatPromptTemplate.from_messages(
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
    llm = ChatOpenAI(
        model=openai_model,
        api_key=openai_api_key,
        temperature=0,
    )
    chain = prompt | llm | StrOutputParser()
    try:
        result = chain.invoke(
            {
                "categories": _categories_list(cats),
                "filename": filename or "unknown",
                "content": content,
            }
        )
    except Exception:
        return None

    if not result:
        return None
    result = result.strip()
    for category in cats:
        if result.upper() == category.upper():
            return category
    for category in cats:
        if category.upper() in result.upper():
            return category
    return None
