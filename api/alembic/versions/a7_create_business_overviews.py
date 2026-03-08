"""Create business_overviews table

Revision ID: a7_business_overviews
Revises: a6_insights
Create Date: 2025-03-07

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "a7_business_overviews"
down_revision: Union[str, None] = "a6_insights"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "business_overviews",
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(32),
            nullable=False,
            server_default="none",
        ),
        sa.Column("documents_snapshot", sa.String(128), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("business_overviews")
