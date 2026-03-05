# Continuity API

REST backend for Continuity (FastAPI + PostgreSQL). Exposes auth and (later) document upload, analysis, reports, Q&A, and interview sessions.

## Stack

- **FastAPI** – REST API
- **PostgreSQL** – database (async via `asyncpg`)
- **SQLAlchemy 2** – async ORM and migrations (Alembic)
- **JWT** – access tokens for login
- **bcrypt** – password hashing

## Setup

1. **Python 3.11+** and a running **PostgreSQL** instance.

2. **Create a database** (e.g. `continuity`):

   ```bash
   createdb continuity
   ```

3. **From the `api` directory**, create a virtualenv and install deps:

   ```bash
   cd api
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```

4. **Copy env and edit**:

   ```bash
   copy .env.example .env   # Windows
   # cp .env.example .env   # macOS/Linux
   ```

   Set `DATABASE_URL` to your Postgres connection (use `postgresql+asyncpg://...`). Set a strong `SECRET_KEY` in production.

5. **Run migrations**:

   ```bash
   alembic upgrade head
   ```

6. **Run the server**:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   API base: `http://localhost:8000`. Docs: `http://localhost:8000/docs`.

## Document classification (Celery + Redis + LangChain)

After upload, each document is classified in the background into one of 10 categories (e.g. FINANCIAL INFORMATION, LEGAL & COMPLIANCE). The classifier uses LangChain and an LLM (OpenAI by default); the result is stored in the `documents.classification` column.

1. **Run Redis** (e.g. locally):

   ```bash
   redis-server
   ```

2. **Set env** in `.env`:

   - `REDIS_URL=redis://localhost:6379/0`
   - `OPENAI_API_KEY=<your-key>` (required for classification; if missing, classification stays `null`)
   - Optionally `OPENAI_MODEL=gpt-4o-mini` (default) or another model
   - `DATABASE_URL_SYNC=postgresql+psycopg2://postgres:postgres@localhost:5432/continuity` (sync URL for Celery workers)

3. **Run a Celery worker** from the `api` directory:

   ```bash
   celery -A app.celery_app worker --loglevel=info
   ```

4. **Run migrations** so the `documents.classification` column exists:

   ```bash
   alembic upgrade head
   ```

Uploaded documents will get a classification asynchronously; list/get document responses include `classification` (string or null).

## Auth endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register with email and password |
| `POST` | `/api/auth/login` | Login; returns JWT and user info (for redirect to dashboard) |
| `GET`  | `/api/auth/me`       | Current user (requires `Authorization: Bearer <token>`) |
| `POST` | `/api/auth/logout`   | Log out (requires Bearer token); client should discard token after calling |

- **Register**: body `{ "email": "user@example.com", "password": "..." }`. Password: 8–128 chars, at least one upper, one lower, one digit.
- **Login**: same body; response includes `access_token` and `user` (id, email, etc.). Frontend can store the token and redirect to dashboard.
- **Protected routes**: send header `Authorization: Bearer <access_token>`.

## Project layout

- **app/** – FastAPI app
  - **config.py** – settings from env
  - **database.py** – async engine and session
  - **deps.py** – `get_current_user` and DB dependency
  - **main.py** – app, CORS, router mount
  - **models/** – SQLAlchemy models (e.g. `User`)
  - **routers/** – route modules (e.g. `auth`)
  - **schemas/** – Pydantic request/response models
  - **services/** – auth helpers (password hash, JWT)
- **alembic/** – migrations
- **requirements.txt** – Python dependencies
