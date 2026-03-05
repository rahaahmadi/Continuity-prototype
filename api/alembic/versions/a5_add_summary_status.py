"""Add summary_status column (none | pending | ready | failed)

Revision ID: a5_summary_status
Revises: a4_summary
Create Date: 2025-03-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a5_summary_status"
down_revision: Union[str, None] = "a4_summary"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "documents",
        sa.Column(
            "summary_status",
            sa.String(32),
            nullable=False,
            server_default="none",
        ),
    )


def downgrade() -> None:
    op.drop_column("documents", "summary_status")
