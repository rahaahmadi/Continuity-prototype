"""Add document classification column

Revision ID: a3_classification
Revises: a2_documents
Create Date: 2025-03-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a3_classification"
down_revision: Union[str, None] = "a2_documents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("classification", sa.String(128), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "classification")
