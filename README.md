# Splitwisely Backend

REST API and PostgreSQL for **Splitwisely**, an expense-splitting portfolio app.

Sibling frontend repo: [Splitwisely-frontend](https://github.com/Rahul484626/Splitwisely-frontend)

## Stack

- Node.js 22+ + Express (TypeScript)
- PostgreSQL via `pg` (no ORM)
- Migrations: `node-pg-migrate`
- Validation: Zod
- Tests: Jest + Supertest
- Local DB: Docker Compose **or** local Postgres 18

## Quick start

```bash
# use Node 22+
cp .env.example .env
# set DATABASE_URL password to match your Postgres

# Option A — Docker
docker compose up -d

# Option B — local Postgres
createdb -U postgres splitwisely   # if DB does not exist

npm install
npm run migrate:up
npm run dev                        # http://localhost:3000/health
npm test
npm run lint
```

## Docs

Start with [`AGENTS.md`](./AGENTS.md). Product and API truth lives under [`docs/`](./docs/).

## API docs

With the server running:

- Swagger UI: http://localhost:3000/api/docs
- OpenAPI JSON: http://localhost:3000/api/v1/openapi.json

## Status

Phases 1–5: auth, groups, expenses, balances/settle, OpenAPI + rate limit on auth.
