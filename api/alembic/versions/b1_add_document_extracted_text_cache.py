"""Add cached extracted_text to documents table

Revision ID: b1_document_extracted_text
Revises: a9_business_profiles
Create Date: 2026-03-26
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b1_document_extracted_text"
down_revision: Union[str, None] = "a9_business_profiles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("extracted_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "extracted_text")
