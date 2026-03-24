"""Add key_insights to business_overviews

Revision ID: a8_key_insights
Revises: a7_business_overviews
Create Date: 2026-03-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "a8_key_insights"
down_revision: Union[str, None] = "a7_business_overviews"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "business_overviews",
        sa.Column("key_insights", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("business_overviews", "key_insights")
