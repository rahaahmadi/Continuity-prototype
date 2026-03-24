"""Rename business_overviews to business_profiles and split report states

Revision ID: a9_business_profiles
Revises: a8_key_insights
Create Date: 2026-03-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a9_business_profiles"
down_revision: Union[str, None] = "a8_key_insights"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("business_overviews", "business_profiles")
    op.alter_column(
        "business_profiles",
        "content",
        new_column_name="business_overview_content",
    )
    op.alter_column(
        "business_profiles",
        "status",
        new_column_name="business_overview_status",
    )
    op.alter_column(
        "business_profiles",
        "documents_snapshot",
        new_column_name="business_overview_documents_snapshot",
    )

    op.add_column(
        "business_profiles",
        sa.Column(
            "key_insights_status",
            sa.String(32),
            nullable=False,
            server_default="none",
        ),
    )
    op.add_column(
        "business_profiles",
        sa.Column("key_insights_documents_snapshot", sa.String(128), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("business_profiles", "key_insights_documents_snapshot")
    op.drop_column("business_profiles", "key_insights_status")

    op.alter_column(
        "business_profiles",
        "business_overview_documents_snapshot",
        new_column_name="documents_snapshot",
    )
    op.alter_column(
        "business_profiles",
        "business_overview_status",
        new_column_name="status",
    )
    op.alter_column(
        "business_profiles",
        "business_overview_content",
        new_column_name="content",
    )
    op.rename_table("business_profiles", "business_overviews")
