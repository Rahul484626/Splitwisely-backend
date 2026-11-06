# AGENTS.md — Splitwisely Backend

Operating manual for AI agents working in this repository.

## Product

**Splitwisely** is an expense-splitting app (web + Android + iOS). Users create groups, add shared expenses, split them (equal / exact / percentage / shares), see who owes whom, simplify debts, and record settlements.

## Two-repo layout

| Repo | Role |
| --- | --- |
| **This repo** (`Splitwisely-backend`) | Express API, PostgreSQL, Docker Compose, shared product docs |
| Sibling `Splitwisely-frontend` | Ionic Angular + Capacitor UI; design/mobile docs |

Shared contract: [`docs/api.md`](./docs/api.md) (OpenAPI generated in Phase 5). **Update `api.md` before changing either codebase.**

## Non-negotiable rules

1. **No ORM.** Use `pg` with parameterized native SQL and `node-pg-migrate` plain-SQL migrations.
2. **Money as integers.** Store `amount_minor` / `share_minor` as `BIGINT` (paise for INR). Never floats.
3. **Default currency:** INR. One currency per group in v1.
4. Soft-delete expenses; never hard-delete users (soft-deactivate).
5. Conventional Commits. Explain SQL briefly when introducing new queries.

## Stack (pin at Phase 1 after version check)

- Node.js (Active LTS) + Express + TypeScript
- PostgreSQL + `pg` + `node-pg-migrate`
- Zod validation, JWT + refresh rotation, bcrypt/argon2
- Jest + Supertest; Docker Compose for Postgres (+ API)

Reference check Nov 2026: Express 5.x, PostgreSQL 18.x, Node Active LTS.

## How to run (after Phase 1)

```bash
docker compose up -d          # Postgres (and API when wired)
npm install
npm run migrate:up
npm run dev                   # API on :3000 (or configured port)
npm test
```

Env: see `docs/architecture.md` (`DATABASE_URL`, `JWT_*`, `FRONTEND_ORIGIN`).

## Docs map

| File | Read when |
| --- | --- |
| [docs/prd.md](./docs/prd.md) | Scope, personas, acceptance criteria |
| [docs/flow.md](./docs/flow.md) | User/system flows (Mermaid) |
| [docs/uml-diagrams.md](./docs/uml-diagrams.md) | Domain, sequences, ER |
| [docs/architecture.md](./docs/architecture.md) | Layers, auth, deploy, CORS |
| [docs/database.md](./docs/database.md) | DDL, indexes, balance SQL |
| [docs/api.md](./docs/api.md) | REST contract |
| [docs/security.md](./docs/security.md) | Auth, injection, OWASP |
| [docs/roadmap.md](./docs/roadmap.md) | Phased tasks |
| [docs/progress.md](./docs/progress.md) | Living session log — append after every task |
| [docs/glossary.md](./docs/glossary.md) | Domain terms |
| [docs/skills.md](./docs/skills.md) | Playbooks + resume bullets |
| [docs/coding-standards.md](./docs/coding-standards.md) | Style, SQL, commits |
| [docs/testing-strategy.md](./docs/testing-strategy.md) | Test layers and targets |
| [docs/decisions/](./docs/decisions/) | ADRs |

Frontend-owned: design, mobile — see sibling repo `docs/`.

## Before coding

1. Read `prd.md` + `database.md` for schema truth.
2. For API work, update `api.md` first (contract checklist in `skills.md`).
3. Append to `progress.md` when a task finishes.
