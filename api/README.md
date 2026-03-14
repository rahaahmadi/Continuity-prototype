# Continuity API

REST backend for Continuity (FastAPI + PostgreSQL + Celery). Exposes auth, document upload, classification, insights, summarization, and business overview.

## Stack

- **FastAPI** – REST API
- **PostgreSQL** – database (async via `asyncpg`)
- **SQLAlchemy 2** – async ORM and migrations (Alembic)
- **JWT** – access tokens for login
- **bcrypt** – password hashing
- **Celery + Redis** – background tasks (classification, insights, summarization, business overview)
- **LangChain + OpenAI** – LLM-based document processing

## Setup

1. **Python 3.10+** and a running **PostgreSQL** instance.

2. **Create a database** (e.g. `continuity`):

   ```bash
   createdb continuity
   ```

3. **From the `api` directory**, install dependencies:

   ```bash
   cd api
   pip install -e .   # or: pip install -r requirements.txt
   ```

4. **Copy env and edit**:

   ```bash
   copy .env.example .env   # Windows
   # cp .env.example .env   # macOS/Linux
   ```

   Set `DATABASE_URL` (use `postgresql+asyncpg://...`). Set a strong `SECRET_KEY` in production.

5. **Run migrations**:

   ```bash
   alembic upgrade head
   ```

6. **Run the server** (from the `api` directory only; no PYTHONPATH):

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   API base: `http://localhost:8000`. Docs: `http://localhost:8000/docs`.

## Celery (background tasks)

1. **Run Redis** (e.g. locally): `redis-server`

2. **Set in `.env`**: `REDIS_URL`, `OPENAI_API_KEY`, `DATABASE_URL_SYNC` (sync Postgres URL for workers).

3. **Run a Celery worker** from the `api` directory:

   ```bash
   celery -A app.celery_app worker --loglevel=info
   ```

## Tests

From the `api` directory:

```bash
pip install -e ".[dev]"
pytest          # runs unit/smoke tests (health, auth required)
pytest -m integration   # runs integration tests (requires running Postgres)
```

## Project layout

All backend code lives under **api/** so you run and test from here without PYTHONPATH.

- **app/** – FastAPI application
  - **config.py** – settings from env
  - **database/** – async engine/session (`__init__.py`), sync session for Celery (`sync_db.py`)
  - **deps.py** – `get_db`, `get_current_user`
  - **main.py** – app, CORS, routers
  - **models/** – SQLAlchemy models (`User`, `Document`, `BusinessOverview`)
  - **routers/** – thin HTTP layer; delegate to services
  - **schemas/** – Pydantic request/response models
  - **services/** – auth, documents, business overview; orchestrate domain and DB
  - **tasks/** – Celery tasks
- **src/** – Domain (no imports from `app`)
  - **constants.py** – e.g. document categories
  - **services/** – document classification, insights, summarization, loader, business overview narrative
- **tests/** – pytest (health, auth, documents, business overview)
- **alembic/** – migrations
- **requirements.txt** – Python dependencies (also in `pyproject.toml`)

Domain logic in `src/` must not depend on `app`; config and persistence are passed in by services and tasks.
