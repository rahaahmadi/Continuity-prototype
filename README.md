# Continuity

Agentic system to help small business owners prepare to sell: document upload and analysis, buyer-ready reports, Q&A over business knowledge, and owner interviews to externalize operations.

## Repository structure

| Directory   | Purpose |
|------------|---------|
| **frontend/** | Web UI (React + Vite). Landing, dashboard, documents, reports, Q&A. |
| **src/**      | Agentic core: agents, tools, memory, workflows. No implementation yet. |
| **api/**      | REST backend layer. Routes, services, middleware. No implementation yet. |
| **docs/**     | Design and operational docs (optional). |
| **scripts/**  | Dev/deploy scripts (optional). |

## Requirements

- Node.js & npm (e.g. [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

## Quick start (frontend only)

```sh
cd frontend
npm install
npm run dev
```

The API and agentic core are scaffold-only for now; implement when you add the backend.
