"""Sync SQLAlchemy engine and session for Celery workers (document classification, etc.)."""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.database import Base
from app.models import BusinessProfile, Document, User  # noqa: F401 - register models

sync_engine = create_engine(
    settings.database_url_sync,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=2,
    max_overflow=5,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_sync_session() -> Session:
    """Return a sync session (for use in Celery tasks)."""
    return SyncSessionLocal()
