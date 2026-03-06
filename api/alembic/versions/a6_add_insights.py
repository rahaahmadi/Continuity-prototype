"""Add insights and insights_status columns to documents

Revision ID: a6_insights
Revises: a5_summary_status
Create Date: 2025-03-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "a6_insights"
down_revision: Union[str, None] = "a5_summary_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "documents",
        sa.Column("insights", JSONB, nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column(
            "insights_status",
            sa.String(32),
            nullable=False,
            server_default="none",
        ),
    )


def downgrade() -> None:
    op.drop_column("documents", "insights_status")
    op.drop_column("documents", "insights")
