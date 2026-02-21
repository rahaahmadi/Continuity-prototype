# Agentic core

This directory holds the main agentic logic for Continuity: document ingestion, analysis, report generation, Q&A over business knowledge, and owner-interview flows.

## Intended structure (scaffold only)

- **agents/** — Agent definitions and orchestration (e.g. document analyzer, report generator, interview conductor).
- **tools/** — Reusable tools used by agents (e.g. document parsing, embeddings, external APIs).
- **memory/** — Knowledge base, document store, and conversation memory.
- **workflows/** — Multi-step workflows (e.g. full preparation pipeline, interview → report).

No implementation yet; add code when you start building.
