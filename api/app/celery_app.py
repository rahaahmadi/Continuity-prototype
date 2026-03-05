"""Celery application with Redis broker for background tasks (e.g. document classification)."""

from celery import Celery

from app.config import settings

app = Celery(
    "continuity",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.document_tasks"],
)
app.conf.update(
    task_serializer=settings.celery_task_serializer,
    result_serializer=settings.celery_result_serializer,
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 min max per task
    worker_prefetch_multiplier=1,  # one task at a time per worker for predictability
)
