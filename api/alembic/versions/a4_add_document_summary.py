"""Add document summary column

Revision ID: a4_summary
Revises: a3_classification
Create Date: 2025-03-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a4_summary"
down_revision: Union[str, None] = "a3_classification"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("summary", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "summary")
