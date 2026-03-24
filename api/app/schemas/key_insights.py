"""Request/response schemas for key insights report."""

from pydantic import BaseModel, Field


class KeyInsightResponse(BaseModel):
    title: str
    description: str


class KeyInsightsResponse(BaseModel):
    key_insights: list[KeyInsightResponse] = Field(default_factory=list)
    status: str  # none | pending | ready | failed

    model_config = {"from_attributes": True}
