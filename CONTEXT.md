# Twinkle-Hearts — Deep Context (CONTEXT.md)

This file provides domain and business-logic context that AGENTS.md does not cover.
Read it for non-obvious decisions, the "why" behind the architecture, and the
order/checkout flow that an agent must respect when touching cart or order code.

## Business Model

Twinkle-Hearts is a **greeting-card e-commerce PWA** targeting the **Sri Lankan**
market. It deliberately avoids a payment gateway (no Stripe/ PayPal) and instead
uses a **WhatsApp-based checkout**: the customer's order becomes a pre-formatted
WhatsApp message sent to the store owner's number. This keeps integration cost
near zero and suits a market where WhatsApp is the dominant communication channel.

### Implications for code
- There is **no payment state machine** beyond `PENDING_WHATSAPP_CONFIRMATION`.
- Order "confirmation" is manual (owner replies on WhatsApp). Do not invent
  automated payment webhooks unless explicitly asked.
- Currencies are **LKR only**. Do not add multi-currency.
- **18% VAT** is applied server-side at order creation, never on the client.

## Checkout / Order Flow

```
1. Cart (frontend Zustand + Dexie) ──sync──▶ POST /api/cart/sync
2.   backend re-validates price + stock per item (DB is source of truth)
3. Checkout page ──create──▶ POST /api/orders
4.   backend re-validates prices, computes subtotal + tax (18%) + total
5.   order row inserted with status PENDING_WHATSAPP_CONFIRMATION
6.   backend builds wa.me/{number}?text={encoded order summary}
7.   response returns the WhatsApp deep link; frontend redirects / shows it
8. Admin sees order in /admin/orders; can update status (manual).
```

**Hard rule**: any code that computes an order total or trusts a client-sent price
is a security bug. Always recompute from `Product` rows in the database.

## Multilingual UI

Frontend loads **English, Sinhala, Tamil** fonts (Noto Serif). UI copy is not yet
fully internationalized in code — do not assume a single-language codebase. When
adding user-facing strings, keep them in components (no i18n framework yet), but
avoid hard-coding English-only assumptions in logic.

## Offline-First PWA

- Cart persists in **IndexedDB** via Dexie (`frontend/src/store/db.ts`).
- Service worker (Workbox in `vite.config.ts`) caches API responses NetworkFirst
  and images CacheFirst.
- If offline at checkout, the order must queue and flush when back online
  (`useOnlineStatus` + cart store sync). Do not break offline behavior.

## Cloudflare Architecture

| Concern | Binding | Local | Prod |
|---|---|---|---|
| Compute | Hono on Workers | `wrangler dev` | Workers |
| DB | Prisma + D1 adapter | local sqlite `dev.db` | D1 |
| Cache/sessions | KV | Redis (docker) | KV |
| Images | R2 / Cloudinary | Cloudinary | R2 |

`backend/wrangler.toml` declares D1/KV/R2 bindings. `deploy-cloudflare.ps1` is the
full prod deploy script (creates D1, KV, R2, JWT keys, deploys Worker + Pages).

**Gotcha**: backend is bundled for the **Workers runtime** — no Node built-ins,
no filesystem. Use `getPrisma()` (D1 adapter), not a raw Postgres client.

## Testing

- **Backend**: Vitest, 254 tests (unit + integration). DB is mocked via
  `backend/tests/helpers/` (testApp, db, factories, mocks).
- **Frontend**: Vitest + Testing Library, jsdom env.
- Run `npm run test` (root) to cover both. Never run tests from repo root with
  raw `tsc` — use the workspace scripts.

## Conventions Summary (quick)

- Conventional commits; short hyphenated branches.
- No `any`; strict TS everywhere.
- Hono middleware order: requestId → rateLimiter → auth → validation → handler.
- Zustand for all frontend state; Dexie for cart persistence.
- Graphify graph in `graphify-out/` — regenerate with `graphify update .`.
