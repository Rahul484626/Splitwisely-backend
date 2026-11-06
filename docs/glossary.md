# Splitwisely — Glossary

| Term | Meaning |
| --- | --- |
| **Expense** | A shared cost recorded in a group: who paid, how much, how it splits. |
| **Split** | One member's share of an expense (`share_minor`). |
| **Share** | (1) A split row, or (2) the `shares` split type using relative weights. |
| **Settlement** | A recorded payment from one member to another that reduces debt. |
| **Simplify debts** | Algorithm that turns nets into the fewest suggested payments. |
| **Net balance** | For a member: paid − owed + settlements received − settlements sent. Positive = others owe them. |
| **Minor unit** | Smallest currency unit stored as integer (paise for INR). Never floats. |
| **Soft delete** | Expense kept with `deleted_at` set; excluded from balances. |
| **Group** | Named container of members + expenses with one currency (v1). |
| **Activity** | Append-only log entry for feed (`activity_log`). |
| **Access token** | Short-lived JWT for API calls. |
| **Refresh token** | Long-lived credential, rotated and stored hashed server-side. |
