# ADR-0005: Glassmorphism with fallbacks

## Status

Accepted

## Context

Dark glass fits a finance aesthetic and matches existing mockups. Heavy `backdrop-filter` hurts low-end Android and fails accessibility when transparency is reduced.

## Decision

Use glass as an accent (cards, nav, modals) on a navy canvas with blob glows. Always provide solid fallback when `@supports` fails or `prefers-reduced-transparency` is set. Cap blur 12–20px and ≤2 stacked blurred layers. Tokens as CSS variables for a future light theme.

## Consequences

- Frontend owns design tokens (sibling repo).
- Must verify contrast ≥ 4.5:1 for body text.
- Never encode owe/owed with color alone.
