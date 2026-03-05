"""Application configuration from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Continuity API"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/continuity"

    # Auth
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS (comma-separated origins; * for development only)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Document uploads (directory on server; created if missing)
    upload_dir: str = "./uploads"

    # Redis (for Celery broker and result backend)
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_task_serializer: str = "json"
    celery_result_serializer: str = "json"

    # LLM for document classification (e.g. OpenAI; set OPENAI_API_KEY)
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    # Sync DB URL for Celery workers (same as database_url but sync driver)
    database_url_sync: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/continuity"


settings = Settings()
