# Splitwisely — Product Requirements (PRD)

## Goals

- Ship a resume-grade expense-splitting product: web + Android (iOS when Mac available).
- Demonstrate native SQL (balances, rounding, transactions), clean API design, and polished dark-glass UI.
- Learn by building: every non-trivial query is written by hand and explained briefly.

## Non-goals (v1)

- Realtime sync (SSE/WebSockets) — stretch.
- Receipt photo OCR — camera capture is stretch; OCR out of scope.
- Multi-currency conversion / FX rates.
- Recurring expenses.
- CSV/PDF export.
- Social login (Google/Apple) — email/password only in v1.
- Hard delete of financial history.

## Personas

| Persona | Need |
| --- | --- |
| Roommate | Split rent, utilities, groceries fairly |
| Trip organizer | Track group trip spends and settle at end |
| Pair of friends | Simple 1:1 IOUs without a full group |

## User stories (MVP)

### Auth

| ID | Story | Acceptance |
| --- | --- | --- |
| US-A1 | Sign up with name, email, password | Email unique; password hashed; returns access + refresh |
| US-A2 | Sign in | Invalid credentials → 401; valid → tokens |
| US-A3 | Refresh access token | Rotating refresh; reuse of old refresh → revoke family |
| US-A4 | Sign out | Refresh token invalidated |

### Groups & members

| ID | Story | Acceptance |
| --- | --- | --- |
| US-G1 | Create a group with name + currency | Creator is admin member; currency fixed for v1 |
| US-G2 | List my groups with my net balance | Soft-deleted expenses excluded |
| US-G3 | View group detail | Members, expenses, pairwise / simplified debts |
| US-G4 | Invite / add member | See Open Questions (invite method) |
| US-G5 | Leave group | Blocked if non-zero net balance (or force with settlement first) |

### Expenses

| ID | Story | Acceptance |
| --- | --- | --- |
| US-E1 | Add expense with equal split | Splits sum to amount; activity logged; atomic txn |
| US-E2 | Add expense exact / % / shares | Same as E1; rounding rule applied |
| US-E3 | Edit expense | Recreate splits in txn; activity logged |
| US-E4 | Soft-delete expense | `deleted_at` set; excluded from balances; still in history |

### Balances & settle

| ID | Story | Acceptance |
| --- | --- | --- |
| US-B1 | See net balance per member | Matches SQL catalog in `database.md` |
| US-B2 | See simplified debts | Greedy largest-creditor/debtor algorithm |
| US-B3 | Record settlement | Updates balances; activity logged |
| US-B4 | Dashboard totals | You owe / you are owed / recent activity |

### Friends & activity

| ID | Story | Acceptance |
| --- | --- | --- |
| US-F1 | Friends list | Users who share ≥1 group with me |
| US-ACT1 | Activity feed | Paginated `activity_log` for my groups |

### Profile

| ID | Story | Acceptance |
| --- | --- | --- |
| US-P1 | Update name / default currency | Validated; currency ISO-like code |
| US-P2 | Theme preference | Stored client-side in v1; API optional later |

## MVP vs stretch

| MVP | Stretch |
| --- | --- |
| Email/password auth + refresh | Social login, email verify |
| Groups, members, invites (TBD method) | Roles beyond admin/member |
| Four split types + soft delete | Recurring expenses |
| Balances + simplify + settlements | Realtime updates |
| Activity feed | Push notifications |
| Web + Android shell | iOS publish, receipt camera |
| OpenAPI + typed client | CSV export, multi-currency |

## Screens (frontend)

1. Sign in / sign up  
2. Dashboard  
3. Groups list  
4. Group detail  
5. Add expense  
6. Settle up  
7. Friends  
8. Activity feed  
9. Profile / settings  

Mockups: frontend `Dashboard-html/`, `Group detail-html/`. Screen 5 pending.

## Open Questions

1. **Invites:** email magic link vs shareable invite code vs add-by-email of existing users only?
2. **Leave group with balance:** block until settled, or allow with warning?
3. **Hosting:** GitHub-only repos, or also mirror elsewhere?
4. **Screen 5 mockup:** still to be created before UI polish.
5. **Capacitor app id:** propose `com.rahul.splitwisely` — confirm before Phase 6.
