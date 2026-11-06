# ADR-0006: Shared contract via api.md → OpenAPI (two repos)

## Status

Accepted

## Context

Backend and frontend are separate GitHub repos. Without a single contract, endpoints drift.

## Decision

1. `docs/api.md` in **this** repo is the human-readable source of truth during early phases.
2. Phase 5: generate OpenAPI/Swagger from the backend.
3. Frontend generates a typed API client from that OpenAPI spec.
4. Contract change checklist (`docs/skills.md`): update `api.md` → backend → OpenAPI/client → frontend → both `progress.md` files.

## Consequences

- Agents must not invent endpoints only in FE or only in BE.
- Cross-repo PRs may be sequenced (BE first).
- CORS/`FRONTEND_ORIGIN` and `API_BASE_URL` documented in `architecture.md`.
