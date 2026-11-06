# Splitwisely — REST API Contract

Base URL (local): `http://localhost:3000/api/v1`  
Auth: `Authorization: Bearer <access_token>` unless noted.  
Amounts: integer **minor units**. Currency codes as strings (`INR`).  
OpenAPI lives at `src/openapi/openapi.json`. Browse Swagger UI at `/api/docs` when the API is running. Frontend regenerates types via `npm run openapi:sync`.


## Error format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [{ "path": "email", "message": "Invalid email" }]
  }
}
```

| Status | When |
| --- | --- |
| 400 | Validation / business rule (splits sum mismatch) |
| 401 | Missing/invalid/expired access token |
| 403 | Authenticated but not allowed (not a group member) |
| 404 | Resource not found (or hidden) |
| 409 | Conflict (email taken, refresh reuse) |
| 429 | Rate limited |
| 500 | Unexpected |

## Pagination

Query: `?limit=20&cursor=<opaque>` (prefer cursor) or `?limit=20&offset=0`.  
Response meta: `{ "nextCursor": "..." | null, "limit": 20 }`.

---

## Auth

### `POST /auth/register`

Body: `{ "name": string, "email": string, "password": string, "defaultCurrency?": "INR" }`  
Response `201`: `{ "user": User, "accessToken": string, "refreshToken": string }`

### `POST /auth/login`

Body: `{ "email": string, "password": string }`  
Response `200`: same as register.

### `POST /auth/refresh`

Body: `{ "refreshToken": string }` — no Bearer required.  
Response `200`: `{ "accessToken": string, "refreshToken": string }`  
On reuse of revoked token in a family: revoke family, `401`.

### `POST /auth/logout`

Body: `{ "refreshToken": string }`  
Response `204`.

---

## Users / me

### `GET /me`

Response `200`: `User`

### `PATCH /me`

Body: `{ "name?", "defaultCurrency?" }`  
Response `200`: `User`

### `User` shape

```json
{
  "id": "uuid",
  "name": "Aarav",
  "email": "a@example.com",
  "defaultCurrency": "INR",
  "createdAt": "ISO-8601"
}
```

---

## Groups

### `POST /groups`

Body: `{ "name": string, "currency?": "INR" }`  
Response `201`: `Group` (caller is admin member)

### `GET /groups`

Response `200`: `{ "items": GroupSummary[] }`  
`GroupSummary` includes `myNetMinor`.

### `GET /groups/:groupId`

Response `200`: `GroupDetail` (members, myNetMinor, totals)

### `PATCH /groups/:groupId`

Body: `{ "name?" }` — admin only. Currency immutable in v1.

### `POST /groups/:groupId/members`

Body depends on invite decision (Open Question). Interim v1 shape:  
`{ "email": string }` — adds existing user by email.  
Response `201`: `Member`

### `DELETE /groups/:groupId/members/:userId`

Leave or remove (admin). `400` if non-zero balance unless `?force=true` (see PRD).

### `Group` / summary shapes

```json
{
  "id": "uuid",
  "name": "Goa Trip",
  "currency": "INR",
  "createdBy": "uuid",
  "myNetMinor": 340000,
  "memberCount": 4,
  "createdAt": "ISO-8601"
}
```

---

## Expenses

### `POST /groups/:groupId/expenses`

Body:

```json
{
  "description": "Dinner",
  "amountMinor": 150000,
  "paidBy": "uuid",
  "splitType": "equal",
  "participants": ["uuid", "uuid"],
  "splits": [{ "userId": "uuid", "shareMinor": 75000 }]
}
```

- `equal`: `participants` required; server computes shares. `splits` optional/ignored.
- `exact` | `percentage` | `shares`: `splits` required; server validates / normalizes to minor units.

Response `201`: `Expense` with nested `splits`.

### `GET /groups/:groupId/expenses`

Paginated list. Query `includeDeleted=true` optional (default false).

### `GET /groups/:groupId/expenses/:expenseId`

### `PATCH /groups/:groupId/expenses/:expenseId`

Same body as create (full replace of splits). Soft-deleted → `404`/`409`.

### `DELETE /groups/:groupId/expenses/:expenseId`

Soft delete. Response `204`.

### `Expense` shape

```json
{
  "id": "uuid",
  "groupId": "uuid",
  "description": "Dinner",
  "amountMinor": 150000,
  "currency": "INR",
  "paidBy": "uuid",
  "splitType": "equal",
  "splits": [{ "userId": "uuid", "shareMinor": 75000 }],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "deletedAt": null
}
```

---

## Dashboard

### `GET /dashboard`

Auth required. Aggregates nets across all groups for the current user.

Response `200`:

```json
{
  "youOweMinor": 182000,
  "youAreOwedMinor": 607000,
  "overallMinor": 425000
}
```

## Balances & settlements

### `GET /groups/:groupId/balances`

Response:

```json
{
  "members": [{ "userId": "uuid", "netMinor": 12000 }],
  "simplified": [
    { "fromUserId": "uuid", "toUserId": "uuid", "amountMinor": 5000 }
  ]
}
```

### `POST /groups/:groupId/settlements`

Body: `{ "fromUserId": "uuid", "toUserId": "uuid", "amountMinor": number, "note?": string }`  
Response `201`: `Settlement`

### `GET /groups/:groupId/settlements`

Paginated.

---

## Friends & activity

### `GET /friends`

Users sharing ≥1 group: `{ "items": [{ "userId", "name", "sharedGroupCount" }] }`

### `GET /activity`

Paginated cross-group activity for current user.

### `GET /groups/:groupId/activity`

Paginated group activity.

---

## Health (no auth)

### `GET /health` (outside `/api/v1` or at `/api/v1/health`)

`{ "status": "ok", "db": "up" }`

---

## Activity types (payload examples)

| type | payload |
| --- | --- |
| `expense.created` | `{ expenseId, description, amountMinor }` |
| `expense.updated` | `{ expenseId }` |
| `expense.deleted` | `{ expenseId }` |
| `settlement.created` | `{ settlementId, fromUserId, toUserId, amountMinor }` |
| `member.added` | `{ userId }` |
| `member.removed` | `{ userId }` |
| `group.created` | `{ name }` |
