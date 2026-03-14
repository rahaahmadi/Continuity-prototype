# Domain (src)

This directory holds domain logic and (future) agentic flows for Continuity.

## Rules

- **src must not import from app.** Domain receives config and data as arguments (e.g. LLM settings, context list). Persistence and HTTP live in `app/`.
- **services/** — Document classification, insights extraction, summarization, document loading, business overview narrative. Used by `app` services and Celery tasks.

## Intended structure (scaffold)

- **agents/** — Agent definitions and orchestration.
- **tools/** — Reusable tools used by agents.
- **memory/** — Knowledge base, document store, conversation memory.
- **workflows/** — Multi-step workflows.

No implementation yet for agents/tools/memory/workflows; add when building.
