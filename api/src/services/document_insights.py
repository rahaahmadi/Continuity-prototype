"""Extract structured M&A due diligence insights from documents using an LLM."""

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


class DocumentInsights(BaseModel):
    """Structured insights extracted from a document."""

    entities: list[str] = Field(default_factory=list, description="Named entities")
    financial_values: list[str] = Field(default_factory=list, description="Financial figures in 'key: value' format describing what the number represents. Do not return numbers without context.")
    important_dates: list[str] = Field(default_factory=list, description="Important dates in 'key: value' format describing the meaning of the date.")
    contracts_or_relationships: list[str] = Field(
        default_factory=list, description="Contracts or business relationships"
    )
    operational_details: list[str] = Field(default_factory=list, description="Operational details")
    risks: list[str] = Field(default_factory=list, description="Risks identified")
    other: list[str] = Field(default_factory=list, description="Other relevant facts")


INSIGHTS_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert due diligence analyst extracting structured insights "
            "from business documents.\n\n"
            "Extract key information relevant for business sale due diligence.\n"
            "Only extract information explicitly present in the document.\n"
            "Do not infer or guess missing details.\n"
            "If a field is not present, return an empty list.\n",
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
    "other": [],
}


def extract_document_insights(
    text: str,
    filename: str = "",
    *,
    openai_api_key: str | None = None,
    openai_model: str = DEFAULT_OPENAI_MODEL,
) -> dict:
    """
    Extract structured insights from document text using the LLM.
    Returns a dict with entities, financial_values, important_dates, etc., or default empty structure on failure.
    """
    if not openai_api_key:
        return DEFAULT_INSIGHTS.copy()

    max_chars = 12000
    content = (text or "").strip()
    if len(content) > max_chars:
        content = content[:max_chars] + "\n\n[... document truncated for insights ...]"
    if not content:
        content = "(No extractable text.)"

    llm = ChatOpenAI(
        model=openai_model,
        api_key=openai_api_key,
        temperature=0,
    )
    structured_llm = llm.with_structured_output(DocumentInsights)
    chain = INSIGHTS_PROMPT | structured_llm
    try:
        result: DocumentInsights = chain.invoke(
            {
                "filename": filename or "unknown",
                "content": content,
            }
        )
        return result.model_dump()
    except Exception:
        return DEFAULT_INSIGHTS.copy()
