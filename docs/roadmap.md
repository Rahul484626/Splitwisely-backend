# Splitwisely — Roadmap

Each phase ends with something demonstrable. Definition of done per phase below.

## Phase 0 — Context (current)

- [x] Two-repo layout decided; docs in backend; thin frontend AGENTS
- [ ] All Phase 0 docs + Cursor rules written
- [ ] User reviews `prd.md` + `database.md`
- [ ] User says **approved**

**Done when:** docs consistent; schema approved; no app code yet.

## Phase 1 — Foundation

- [x] Docker Compose Postgres (`splitwisely` DB)
- [x] Express TS skeleton, health endpoint, config/env
- [x] Initial migration (full DDL) — apply locally once `DATABASE_URL` works
- [x] Jest smoke test for health
- [x] GitHub Actions: lint + test
- [x] Frontend sibling: Ionic Angular shell + design tokens + glass card + CI

**Done when:** `GET /health` green locally and in CI; FE shows glass card on blank shell.


## Phase 2 — Auth & groups

- [x] Register, login, refresh, logout
- [x] `/me` GET/PATCH
- [x] Create/list/get groups; add member by email (interim)
- [x] FE: auth screens + groups list

**Done when:** can register, create group, see it listed.


## Phase 3 — Expenses

- [x] Create/edit/soft-delete with four split types in transactions
- [x] Rounding unit tests
- [x] FE: add expense + group expense list

**Done when:** expense appears in group; splits sum proven by tests.

## Phase 4 — Balances & settle

- [x] Net balance SQL + simplify service
- [x] Settlements + activity feed
- [x] FE: dashboard, balances, settle up, activity

**Done when:** dashboard numbers match SQL fixtures; settle updates nets.


## Phase 5 — Polish

- [x] Empty/loading/error states; a11y pass
- [x] OpenAPI + typed FE client
- [x] Playwright main flow
- [x] EXPLAIN ANALYZE notes in docs

**Done when:** e2e passes; Swagger browsable.


## Phase 6 — Mobile

- [x] Capacitor Android project (`android/`) + sync scripts
- [x] Token storage (Preferences on native); status bar / splash
- [x] Share on settle-up; Camera helper ready (form wiring stretch)
- [ ] Push notifications (stretch — needs FCM)
- [ ] iOS if Mac available

**Done when:** Android project opens in Android Studio and runs against local/deployed API.


## Phase 7 — Ship

- [ ] Deploy API + managed Postgres
- [ ] Host web app
- [ ] README screenshots, demo GIF, architecture diagram

**Done when:** public demo URL works for a recruiter.

## Stretch

Realtime, recurring, multi-currency, CSV export, social login.
