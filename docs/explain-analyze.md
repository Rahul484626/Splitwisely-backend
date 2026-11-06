# Query plans — balances

Recorded against local PostgreSQL 18 with the Phase 4 net-balance CTE.

## Setup notes

- Indexes from initial migration: `expenses(group_id, created_at DESC)`, `expense_splits(user_id)`, `settlements(group_id, created_at DESC)`, `group_members(user_id)`.
- Soft-deleted expenses filtered with `deleted_at IS NULL`.

## How to reproduce

```sql
EXPLAIN (ANALYZE, BUFFERS)
-- paste NET_BALANCE_SQL from balances.repository.ts with a real group UUID
;
```

## Expected shape (qualitative)

| Step | Plan node | Why |
| --- | --- | --- |
| Members | Index/seq scan on `group_members` filtered by `group_id` | Small per-group cardinality |
| Paid | Aggregate on `expenses` using `idx_expenses_group_created` / group_id filter | Exclude deleted |
| Owed | Join `expense_splits` → `expenses` | `expense_id` PK + group filter |
| Settlements | Aggregate `settlements` by from/to | `idx_settlements_group_created` |

## Before vs after indexes (checklist)

When demoing for a resume:

1. Drop `idx_expenses_group_created` temporarily in a scratch DB.
2. Run `EXPLAIN ANALYZE` on the balance query — note Seq Scan / higher cost.
3. Recreate the index — note Index Scan / Bitmap Index Scan and lower execution time.
4. Paste both plans below.

### Sample placeholder (replace with your local output)

```
-- BEFORE (no group_id index on expenses): Seq Scan on expenses ...
-- AFTER: Bitmap Index Scan on idx_expenses_group_created ...
```

Keep real `EXPLAIN` dumps in this file when you capture them on a seeded dataset (≥1k expenses) for a stronger portfolio story.
