# Splitwisely — Coding Standards (Backend)

## TypeScript

- `"strict": true`. No implicit `any`.
- Prefer `unknown` + narrow over `any`.
- Named exports for modules; default export only for app entry if needed.
- Async/await; never leave floating promises.

## Naming

| Kind | Convention |
| --- | --- |
| Files | `kebab-case.ts` or `feature.suffix.ts` (`expense.service.ts`) |
| Types / classes | `PascalCase` |
| Functions / vars | `camelCase` |
| DB columns | `snake_case` |
| Env vars | `SCREAMING_SNAKE` |
| Money fields | `*Minor` in JSON/TS, `*_minor` in SQL |

## Folders

See `architecture.md`. One feature folder under `modules/` with route, controller, service, repository, schemas.

## SQL style

- **Uppercase** keywords: `SELECT`, `FROM`, `WHERE`, `JOIN`.
- `snake_case` identifiers.
- One concern per query when practical; CTEs for balances.
- Always parameterize.

## Error handling

- Throw `AppError(code, message, status, details?)`.
- Central error middleware maps to API error shape.
- Do not `catch` just to log and swallow in services.

## Commits & branching

- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `ci:`).
- Branches: `feat/...`, `fix/...`, `docs/...` from `main`.
- PRs small; link roadmap phase when useful.
- Commit only when the user asks.
