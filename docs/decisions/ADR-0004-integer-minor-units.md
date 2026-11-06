# ADR-0004: Integer minor units for money

## Status

Accepted

## Context

Floating-point money causes rounding bugs and is a classic interview trap. Splitwise-style apps need exact sums.

## Decision

Store all monetary values as `BIGINT` minor units (`amount_minor`, `share_minor`). Default currency INR (paise). API and TS use `*Minor` integers. Never `number` floats for money math.

## Consequences

- Display layer formats to rupees.
- Rounding rules must be explicit and tested.
- JSON cannot use decimals for amounts in the contract.
