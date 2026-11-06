# Splitwisely — Security

## Password hashing

- Prefer **argon2id**; bcrypt cost ≥ 12 acceptable fallback.
- Never log plaintext passwords or hashes in debug dumps.

## JWT

| Token | Lifetime | Notes |
| --- | --- | --- |
| Access | ~15m | Signed HS256 (or better); payload: `sub`, `email`, `iat`, `exp` |
| Refresh | 14–30d | Store **hash** only in `refresh_tokens`; rotate on every use |

Refresh reuse → revoke `family_id` → force login.

## Input validation

- Zod on every mutating/request body and relevant query params.
- Cap string lengths (name, description, note).
- Reject unknown fields in strict schemas where practical.

## SQL injection

- Parameterized `pg` queries only (`$1`…).
- No dynamic SQL from user strings for identifiers; whitelist sort columns if needed.

## Rate limiting

- Auth routes: strict (e.g. 10/min per IP).
- General API: softer limit per IP / user.
- Return `429` with `Retry-After` when possible.

## CORS

- Allow only `FRONTEND_ORIGIN` (comma-separated list in prod).
- Credentials only if cookies introduced later.

## Secrets

- `.env` local only; never commit.
- CI/prod: GitHub Actions secrets / host secret store.
- Rotate JWT secrets with downtime plan (short access TTL helps).

## Transport & headers

- HTTPS in prod.
- `helmet`-style headers on Express.
- Do not embed secrets in Capacitor builds beyond public `API_BASE_URL`.

## OWASP checklist (MVP)

| Item | Status plan |
| --- | --- |
| A01 Broken access control | Membership checks on every group-scoped route |
| A02 Cryptographic failures | argon2/bcrypt; HTTPS; hashed refresh |
| A03 Injection | Parameterized SQL + Zod |
| A04 Insecure design | Soft delete; money as integers |
| A05 Security misconfiguration | Helmet, CORS allowlist, no stack traces in prod |
| A07 Identification/auth failures | Refresh rotation + reuse detection |
| A08 Data integrity | Txn for expense+splits+activity |
| A09 Logging failures | Structured logs; no secrets |
| A10 SSRF | N/A for v1 (no user-supplied URLs fetched) |
