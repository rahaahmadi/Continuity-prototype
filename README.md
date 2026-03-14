# Continuity

## Repository structure

| Directory    | Purpose |
|-------------|---------|
| **api/**    | Backend (FastAPI + PostgreSQL + Celery). Contains `app/` (HTTP, DB, use cases, tasks) and `src/` (domain services). Run everything from `api/`. |
| **frontend/** | Web UI (React + Vite). Landing, dashboard, documents, reports, Q&A. |
| **docs/**   | Design and operational docs (optional). |
| **scripts/** | Dev/deploy scripts (optional). |

## Run the API

From the **api** directory (no PYTHONPATH needed):

```bash
cd api
pip install -e .   # or: pip install -r requirements.txt
# Set .env (see api/.env.example), then:
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API base: `http://localhost:8000`. Docs: `http://localhost:8000/docs`.

For Celery workers (document classification, insights, business overview), run Redis and then from `api/`: `celery -A app.celery_app worker --loglevel=info`.
