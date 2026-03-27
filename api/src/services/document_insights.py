"""Extract structured M&A due diligence insights from documents using an LLM."""

from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from src.prompt_loader import get_prompt

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


class FinancialPoint(BaseModel):
    """Single financial datapoint with period context."""

    period: str = Field(default="", description="Period label, e.g. 'FY2024' or 'TTM'")
    value: str = Field(
        default="",
        description="Raw value as stated in document (e.g. '$2.4M', '2400000')",
    )


class CustomerEntry(BaseModel):
    """One named customer row from a customer list or concentration table."""

    name: str = Field(
        default="",
        description=(
            "Actual customer or counterparty name only (as printed in the document). "
            "Never use cohort labels: e.g. not 'Top 1 customer', 'Top 5 customers', or metric titles."
        ),
    )
    revenue: str = Field(
        default="",
        description="Revenue amount attributed to this customer for the stated period",
    )
    percentage_of_revenue: str = Field(
        default="",
        description="Share of company total revenue for this customer, e.g. '12%'",
    )
    period: str = Field(default="", description="Time period for this customer's revenue / %")


class DocumentInsights(BaseModel):
    """Structured insights extracted from a document."""

    entities: list[str] = Field(default_factory=list, description="Named entities")
    financial_values: list[str] = Field(
        default_factory=list,
        description="Financial figures in 'key: value' format describing what the number represents. Do not return numbers without context.",
    )
    important_dates: list[str] = Field(
        default_factory=list,
        description="Important dates in 'key: value' format describing the meaning of the date.",
    )
    contracts_or_relationships: list[str] = Field(
        default_factory=list, description="Contracts or business relationships"
    )
    operational_details: list[str] = Field(default_factory=list, description="Operational details")
    risks: list[str] = Field(default_factory=list, description="Risks identified")
    other: list[str] = Field(default_factory=list, description="Other relevant facts")

    # Business snapshot extraction
    entity_type: str | None = Field(
        default=None,
        description="Legal entity type (e.g. LLC, S-Corp, C-Corp) if explicitly stated",
    )
    years_operating: float | None = Field(
        default=None,
        description="Number of years in operation if explicitly stated",
    )
    headcount: int | None = Field(
        default=None,
        description="Total employee count if explicitly stated",
    )
    trailing_revenue: str | None = Field(
        default=None,
        description="Trailing twelve month revenue if explicitly stated",
    )
    trailing_ebitda: str | None = Field(
        default=None,
        description="Trailing twelve month EBITDA if explicitly stated",
    )

    # Financial highlights extraction
    revenue_trend_points: list[FinancialPoint] = Field(
        default_factory=list,
        description="Revenue points across periods for trend analysis",
    )
    gross_profit_by_period: list[FinancialPoint] = Field(
        default_factory=list,
        description="Gross profit values across periods",
    )
    gross_margin_pct_by_period: list[FinancialPoint] = Field(
        default_factory=list,
        description="Gross margin percentages across periods",
    )
    cash_and_equivalents_by_period: list[FinancialPoint] = Field(
        default_factory=list,
        description="Cash and cash equivalents balances across periods",
    )
    ebitda_by_period: list[FinancialPoint] = Field(
        default_factory=list,
        description="EBITDA dollar values across periods for trend analysis",
    )
    ebitda_margin_pct_by_period: list[FinancialPoint] = Field(
        default_factory=list,
        description="EBITDA margin percentages across periods for trend analysis",
    )
    debt_total_by_period: list[FinancialPoint] = Field(
        default_factory=list,
        description="Total debt balance across periods (sum of all debt instruments)",
    )
    ebitda_margin: str | None = Field(
        default=None,
        description="EBITDA margin if explicitly stated (e.g. '18.5%')",
    )
    debt_summary: list[str] = Field(
        default_factory=list,
        description="Debt instruments and balances in 'instrument: amount/terms' format",
    )
    working_capital_flags: list[str] = Field(
        default_factory=list,
        description="Working capital risks or notes (AR aging, AP pressure, inventory issues)",
    )

    # Customer concentration extraction
    top_customers: list[CustomerEntry] = Field(
        default_factory=list,
        description=(
            "Named customers only: one row per real customer with optional revenue and % of total. "
            "Exclude roll-up summary rows (top N as % of revenue); use customer_concentration_percentages for those."
        ),
    )
    customer_concentration_percentages: list[str] = Field(
        default_factory=list,
        description=(
            "Aggregate concentration metrics only: e.g. top 1 / top 5 / top 10 share of revenue, "
            "recurring revenue %. Not per-customer names."
        ),
    )
    customer_concentration_risk_tier: str | None = Field(
        default=None,
        description="Concentration risk tier if explicitly stated by source (low, medium, high, or custom label)",
    )


DEFAULT_INSIGHTS = {
    "entities": [],
    "financial_values": [],
    "important_dates": [],
    "contracts_or_relationships": [],
    "operational_details": [],
    "risks": [],
    "other": [],
    "entity_type": None,
    "years_operating": None,
    "headcount": None,
    "trailing_revenue": None,
    "trailing_ebitda": None,
    "revenue_trend_points": [],
    "gross_profit_by_period": [],
    "gross_margin_pct_by_period": [],
    "cash_and_equivalents_by_period": [],
    "ebitda_by_period": [],
    "ebitda_margin_pct_by_period": [],
    "debt_total_by_period": [],
    "ebitda_margin": None,
    "debt_summary": [],
    "working_capital_flags": [],
    "top_customers": [],
    "customer_concentration_percentages": [],
    "customer_concentration_risk_tier": None,
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
    chain = get_prompt("document_insights") | structured_llm
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
