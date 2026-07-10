---
name: twinkle-testing
description: Run and write tests for Twinkle-Hearts (Vitest + Testing Library), check coverage, and mock backend DB/sessions
license: MIT
compatibility: opencode
---

# Twinkle-Hearts Testing

Run and author tests across the monorepo.

## When to use
- After implementing a feature or fix.
- When adding new units/integration tests.
- To verify a bug is covered before fixing.

## Commands (run from repo root)
```bash
npm run test                  # backend + frontend (Vitest)
npm run test --workspace=backend
npm run test --workspace=frontend
npm run test:coverage --workspace=backend
```

## Backend tests
- Framework: **Vitest**. ~254 tests (unit + integration) under `backend/tests/`.
- DB and Redis are **mocked** via `backend/tests/helpers/`
  (`testApp.ts`, `db.ts`, `factories.ts`, `mocks.ts`, `auth.ts`, `constants.ts`).
- Integration tests hit the Hono app through `createTestApp()` — do NOT connect a
  real database in tests.
- Helpers `emailMock` / `whatsappMock` capture side effects (Resend, wa.me links).

## Frontend tests
- Framework: **Vitest + @testing-library/react**, jsdom env (`frontend/vitest.config.ts`).
- Setup mocks localStorage, Dexie (IndexedDB), matchMedia in `frontend/src/test/setup.ts`.
- API client is mocked via `mockFetch` patterns in `frontend/src/__tests__/api.test.ts`.

## Writing new tests
- Mirror existing structure: `*.test.ts` next to source or under `__tests__/`.
- For backend services: use `factories.ts` to build users/products/orders.
- For order/price logic: assert the **server-recomputed** total, never a passed-in value.
- Never use `any`; strict TS applies to tests too.

## Coverage expectations
- Critical paths MUST be tested: order creation, price/stock validation, auth/JWT,
  cart sync, rate limiting. Add tests there first.
