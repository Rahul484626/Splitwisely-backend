# Splitwisely — Flows

## Sign up / login

```mermaid
flowchart TD
  start([Open app]) --> choose{Have account?}
  choose -->|No| register[POST /auth/register]
  choose -->|Yes| login[POST /auth/login]
  register --> tokens[Store access + refresh]
  login --> tokens
  tokens --> dash[Dashboard]
```

## Token refresh

```mermaid
sequenceDiagram
  participant App
  participant API
  participant DB
  App->>API: API call with access JWT
  API-->>App: 401 expired
  App->>API: POST /auth/refresh
  API->>DB: Lookup refresh hash + family
  alt valid
    API->>DB: Revoke old, insert new
    API-->>App: new access + refresh
    App->>API: Retry original request
  else reuse detected
    API->>DB: Revoke family
    API-->>App: 401 force re-login
  end
```

## Create group

```mermaid
flowchart TD
  A[User taps New group] --> B[Enter name + currency]
  B --> C[POST /groups]
  C --> D[Insert groups + group_members admin]
  D --> E[activity_log group.created]
  E --> F[Open group detail]
```

## Invite / add member

```mermaid
flowchart TD
  A[Admin opens Add member] --> B{Invite method TBD}
  B -->|v1 interim| C[Enter existing user email]
  C --> D[POST /groups/:id/members]
  D --> E{User exists?}
  E -->|No| F[404 / 400]
  E -->|Yes| G[Insert group_members]
  G --> H[activity_log member.added]
```

## Add expense (all split types)

```mermaid
flowchart TD
  A[Add expense form] --> B[amountMinor + paidBy + participants]
  B --> C{splitType}
  C -->|equal| D[Server: floor divide + remainder to payer rule]
  C -->|exact| E[Client sends shareMinor per user]
  C -->|percentage| F[Server: pct to minor + remainder rule]
  C -->|shares| G[Server: weight to minor + remainder rule]
  D --> H{sum shares == amount?}
  E --> H
  F --> H
  G --> H
  H -->|No| I[400 VALIDATION_ERROR]
  H -->|Yes| J[BEGIN]
  J --> K[INSERT expenses]
  K --> L[INSERT expense_splits]
  L --> M[INSERT activity_log]
  M --> N[COMMIT]
  N --> O[201 Expense]
```

## View balances

```mermaid
flowchart TD
  A[Open group / dashboard] --> B[GET balances or groups list]
  B --> C[SQL net balance CTE]
  C --> D[Service: simplify debts]
  D --> E[UI: +/− and words + colors]
```

## Settle up

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant API as Backend
  participant DB as Postgres
  U->>FE: Choose from, to, amount
  FE->>API: POST /groups/:id/settlements
  API->>DB: BEGIN
  API->>DB: INSERT settlements
  API->>DB: INSERT activity_log
  API->>DB: COMMIT
  API-->>FE: 201 Settlement
  FE->>API: GET balances
  API-->>FE: Updated nets + simplified
```

## Delete or edit expense

```mermaid
flowchart TD
  edit[Edit] --> txnE[BEGIN: update expense, replace splits, activity]
  txnE --> commitE[COMMIT]
  del[Soft delete] --> txnD[BEGIN: set deleted_at, activity]
  txnD --> commitD[COMMIT]
  commitE --> bal[Balances exclude only deleted]
  commitD --> bal
```
