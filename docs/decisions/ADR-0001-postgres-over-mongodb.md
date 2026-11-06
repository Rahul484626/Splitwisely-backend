# ADR-0001: PostgreSQL over MongoDB

## Status

Accepted

## Context

Expense splitting is relational: users, groups, memberships, expenses, splits, settlements. Balances need aggregations and constraints. The author wants SQL on the resume (PEAN, not MEAN).

## Decision

Use PostgreSQL as the system of record.

## Consequences

- Strong constraints, transactions, CTEs for balances.
- Not MEAN; document as PEAN intentionally.
- Requires migrations and SQL skill investment (desired).
