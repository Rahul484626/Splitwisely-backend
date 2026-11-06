# ADR-0002: No ORM — node-postgres + SQL migrations

## Status

Accepted

## Context

Learning goal is native SQL. ORMs hide queries and make balance CTEs awkward to showcase.

## Decision

Use `pg` with parameterized queries and `node-pg-migrate` plain-SQL migrations. Repositories own SQL; no Prisma/TypeORM/Knex query builder as the primary access layer.

## Consequences

- More boilerplate; clearer interview demos.
- Must enforce invariants (split sums) in services + tests.
- Schema changes always go through migrations + `docs/database.md`.
