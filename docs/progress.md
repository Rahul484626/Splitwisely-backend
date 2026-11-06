# Splitwisely Backend — Progress Log

Append after every completed task. Newest first.

---

## 2026-11-06 — Phase 6 note (frontend)

No backend schema changes. Mobile clients hit the same `/api/v1` (emulator uses `10.0.2.2` → host). Ensure CORS `FRONTEND_ORIGIN` still allows the web origin; native Capacitor HTTP does not use browser CORS the same way for the WebView origin `https://localhost` — if you hit CORS issues on device, add the Capacitor origin or use `@capacitor/http` later.

**Next:** Phase 7 deploy / ship.

---

## 2026-11-06 — Phase 5 / 4 / …

OpenAPI, balances, expenses, auth, foundation.
