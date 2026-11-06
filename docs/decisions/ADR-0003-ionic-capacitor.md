# ADR-0003: Ionic + Capacitor over React Native / Flutter

## Status

Accepted

## Context

Frontend framework choice is Angular. RN/Flutter would require a second UI stack. Ionic has first-class Angular support; Capacitor wraps one codebase for web, Android, iOS.

## Decision

Build UI as Ionic Angular + Capacitor. Ship web/PWA + Android first; iOS when a Mac + Apple Developer account are available.

## Consequences

- One TypeScript UI codebase.
- Native features via Capacitor plugins.
- iOS blocked without Mac; documented in frontend `docs/mobile.md`.
