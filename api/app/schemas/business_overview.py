"""Request/response schemas for business overview."""

from pydantic import BaseModel


class BusinessOverviewResponse(BaseModel):
    """Business overview content and status."""

    content: str | None = None
    status: str  # none | pending | ready | failed

    model_config = {"from_attributes": True}
