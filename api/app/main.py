"""FastAPI application: auth and API entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, business_overview, documents

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(business_overview.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    """Health check for load balancers and monitoring."""
    return {"status": "ok"}
