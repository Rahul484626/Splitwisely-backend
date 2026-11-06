# Splitwisely — UML Diagrams

## Use-case overview

```mermaid
flowchart LR
  User((User))
  User --> UC1[Register / Login]
  User --> UC2[Manage groups]
  User --> UC3[Add / edit / delete expenses]
  User --> UC4[View balances]
  User --> UC5[Settle up]
  User --> UC6[View activity]
  User --> UC7[Manage profile]
```

## Class diagram (domain + services)

```mermaid
classDiagram
  class User {
    UUID id
    string name
    string email
    string defaultCurrency
  }
  class Group {
    UUID id
    string name
    string currency
    UUID createdBy
  }
  class GroupMember {
    UUID groupId
    UUID userId
    string role
  }
  class Expense {
    UUID id
    UUID groupId
    UUID paidBy
    bigint amountMinor
    string splitType
    Date deletedAt
  }
  class ExpenseSplit {
    UUID expenseId
    UUID userId
    bigint shareMinor
  }
  class Settlement {
    UUID id
    UUID groupId
    UUID fromUser
    UUID toUser
    bigint amountMinor
  }
  class ActivityLog {
    UUID id
    string type
    json payload
  }
  class ExpenseService {
    create()
    update()
    softDelete()
    computeShares()
  }
  class BalanceService {
    netByMember()
    simplify()
  }
  Group "1" --> "*" GroupMember
  Group "1" --> "*" Expense
  Expense "1" --> "*" ExpenseSplit
  Group "1" --> "*" Settlement
  Group "1" --> "*" ActivityLog
  ExpenseService --> Expense
  BalanceService --> Expense
  BalanceService --> Settlement
```

## Sequence: add expense

```mermaid
sequenceDiagram
  participant FE
  participant Ctrl as ExpensesController
  participant Svc as ExpenseService
  participant Repo as ExpenseRepository
  participant DB
  FE->>Ctrl: POST expense DTO
  Ctrl->>Ctrl: Zod validate
  Ctrl->>Svc: create(dto, userId)
  Svc->>Svc: authorize membership
  Svc->>Svc: compute/validate shares
  Svc->>Repo: withTransaction
  Repo->>DB: INSERT expense
  Repo->>DB: INSERT splits
  Repo->>DB: INSERT activity
  Repo-->>Svc: Expense
  Svc-->>Ctrl: Expense
  Ctrl-->>FE: 201
```

## Sequence: settle up

```mermaid
sequenceDiagram
  participant FE
  participant Ctrl as SettlementsController
  participant Svc as SettlementService
  participant DB
  FE->>Ctrl: POST settlement
  Ctrl->>Svc: create
  Svc->>Svc: both members, amount > 0
  Svc->>DB: INSERT settlement + activity (txn)
  Svc-->>Ctrl: Settlement
  Ctrl-->>FE: 201
```

## State: expense lifecycle

```mermaid
stateDiagram-v2
  [*] --> Draft: UI form
  Draft --> Active: POST success
  Active --> Active: PATCH
  Active --> SoftDeleted: DELETE
  SoftDeleted --> [*]
  note right of SoftDeleted: Excluded from balances\nKept for history
```

## ER diagram

See [`database.md`](./database.md) for the full Mermaid ER diagram and DDL.
