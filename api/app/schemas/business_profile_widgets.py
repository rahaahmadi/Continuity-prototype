"""Request/response schemas for business profile widgets."""

from pydantic import BaseModel, Field


class InsightPointResponse(BaseModel):
    period: str
    value_raw: str
    value_numeric: float | None = None


class BusinessSnapshotResponse(BaseModel):
    entity_type: str | None = None
    years_operating: float | None = None
    headcount: int | None = None
    trailing_revenue: str | None = None
    trailing_ebitda: str | None = None


class FinancialHighlightsResponse(BaseModel):
    ebitda_margin: str | None = None
    debt_summary: list[str] = Field(default_factory=list)
    working_capital_flags: list[str] = Field(default_factory=list)
    gross_profit_by_period: list[InsightPointResponse] = Field(default_factory=list)
    gross_margin_pct_by_period: list[InsightPointResponse] = Field(default_factory=list)
    cash_and_equivalents_by_period: list[InsightPointResponse] = Field(default_factory=list)
    ebitda_by_period: list[InsightPointResponse] = Field(default_factory=list)
    ebitda_margin_pct_by_period: list[InsightPointResponse] = Field(default_factory=list)
    debt_total_by_period: list[InsightPointResponse] = Field(default_factory=list)


class TopCustomerResponse(BaseModel):
    name: str
    revenue: str | None = None
    percentage_of_revenue: str | None = None
    period: str | None = None


class CustomerConcentrationResponse(BaseModel):
    top_customers: list[TopCustomerResponse] = Field(default_factory=list)
    percentages: list[str] = Field(default_factory=list)
    risk_tier: str | None = None


class BusinessProfileWidgetsResponse(BaseModel):
    status: str  # none | pending | ready
    readiness_score: int
    readiness_completed_checks: int
    readiness_total_checks: int
    business_snapshot: BusinessSnapshotResponse = Field(
        default_factory=BusinessSnapshotResponse
    )
    revenue_trend_points: list[InsightPointResponse] = Field(default_factory=list)
    financial_highlights: FinancialHighlightsResponse = Field(
        default_factory=FinancialHighlightsResponse
    )
    customer_concentration: CustomerConcentrationResponse = Field(
        default_factory=CustomerConcentrationResponse
    )

