# Splitwisely — Skills & Playbooks

## A. Agent playbooks

### Add a migration

1. `npm run migrate:create <name>` (or equivalent).
2. Write plain SQL up/down.
3. Update `docs/database.md` if schema/query catalog changes.
4. Run migrate against local Docker Postgres; smoke-test.
5. Append `docs/progress.md`.

### Add an endpoint end-to-end

1. Update `docs/api.md` (Contract change checklist below).
2. Zod schema → route → controller → service → repository SQL.
3. Membership/auth middleware as needed.
4. Jest + Supertest for success + 400/401/403.
5. Frontend consumes in sibling repo after OpenAPI or hand types.
6. Append both repos' `progress.md` if FE touched.

### Write a repository query with tests

1. Author parameterized SQL; explain in one sentence.
2. Seed fixtures in test DB.
3. Assert numeric balances in minor units.
4. Document in query catalog if reusable.

### Contract change checklist

1. Edit [`docs/api.md`](./api.md) first (shapes, status codes).
2. Implement backend + tests.
3. Update OpenAPI when present (Phase 5); regenerate frontend client.
4. Update frontend callers in `Splitwisely-frontend`.
5. Append `progress.md` in **both** repos.

### Add a screen (frontend repo)

See frontend `AGENTS.md` / design docs. Backend only needed if new endpoints.

---

## B. Resume-ready skills this project demonstrates

- Designed a relational schema for multi-party expenses with soft delete and audit activity.
- Implemented balance calculation in native PostgreSQL using CTEs; no ORM.
- Built deterministic split rounding for equal/percentage/shares with unit tests.
- Implemented greedy debt-simplification and settlement recording.
- Secured API with JWT access + rotating refresh tokens and reuse detection.
- Validated inputs with Zod; prevented SQL injection via parameterized queries.
- Structured Express app in routes → controllers → services → repositories.
- Containerized local Postgres with Docker Compose; CI with GitHub Actions.
- Documented API for a separate Ionic Angular + Capacitor client (OpenAPI contract).
- Applied accessible dark-glass UI tokens with backdrop-filter fallbacks (frontend).
