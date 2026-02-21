# REST API layer

REST backend for Continuity. Exposes endpoints for the frontend: document upload, analysis triggers, report generation, Q&A, and interview sessions.

## Intended structure (scaffold only)

- **routes/** — Route handlers by domain (documents, reports, qa, interviews, etc.).
- **services/** — Business logic that calls into the agentic `src/` core.
- **middleware/** — Auth, validation, error handling.
- **config/** — Environment and app configuration.

No implementation yet; add framework and code when you start building.
