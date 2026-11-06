# Splitwisely — Testing Strategy (Backend)

## Layers

| Layer | Tool | Focus |
| --- | --- | --- |
| Unit | Jest | Rounding, debt simplification, pure mappers |
| Integration / API | Jest + Supertest | Routes against real test Postgres |
| Query | Jest + Postgres | Balance CTEs match fixtures |
| E2E | Playwright (frontend repo) | Main user journeys |

## Unit

- Equal split of `10000` across 3 → shares sum `10000`; remainder to payer rule.
- Percentage and shares edge cases (0%, 100%, uneven weights).
- Simplify: A owes B, B owes C → direct A→C when nets allow.

## API tests

- Register, login, refresh rotation, refresh reuse → 401.
- Create group, add member, create expense all split types.
- Soft-delete excludes from `GET balances`.
- Non-member → 403.
- Validation failures → 400 with `details`.

## Test database

- Docker Compose / CI service container.
- Migrate up before suite; truncate or transactional rollback per test.
- Never point tests at prod.

## Coverage targets (aspirational)

| Area | Target |
| --- | --- |
| Services (balance, splits) | ≥ 90% |
| Controllers / routes | ≥ 70% |
| Overall statements | ≥ 70% |

## What not to do

- Do not mock `pg` for balance correctness tests.
- Do not assert on float rupees; always minor units.
