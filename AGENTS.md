# Twinkle-Hearts — Agent Instructions (AGENTS.md)

This is the primary instruction file for OpenCode and other AI coding agents.
It is loaded automatically at session start. Keep it concise, actionable, and free of
duplicated detail — deep context lives in `CONTEXT.md`, and modular guidance lives
in `.opencode/skills/` and `.opencode/commands/`.

## Project at a Glance

- **What**: Proprietary e-commerce PWA for greeting cards, Sri Lanka market.
- **Checkout**: No payment gateway. Orders are sent via a pre-filled **WhatsApp**
  deep link to the store owner. Flow: cart → validate prices server-side → create
  order (status `PENDING_WHATSAPP_CONFIRMATION`) → generate `wa.me` link.
- **Currency / Tax**: LKR (රු), 18% VAT applied at order creation.
- **Stack**: npm workspaces monorepo — `frontend` (React 18 + Vite + TS),
  `backend` (Hono + Prisma + Cloudflare Workers), `shared` (types/constants/validators).
- **Classification**: PRIVATE COMMERCIAL. Do not disclose code or business logic externally.

## Repository Structure

```
twinkle-hearts/
├── shared/        # @twinkle-hearts/shared — types, constants, zod validators (consumed by both apps)
├── backend/       # @twinkle-hearts/backend — Hono API on Cloudflare Workers + D1
├── frontend/      # @twinkle-hearts/frontend — React PWA (Vite + Tailwind + Zustand)
├── docs/          # deployment.md (local vs Cloudflare prod)
├── graphify-out/  # generated codebase knowledge graph (gitignored)
└── .opencode/    # opencode agents, skills, commands
```

## Build / Dev / Test Commands

Run from repo root unless noted. This is a **npm workspaces** monorepo.

```bash
npm install                       # install all workspaces
npm run dev                      # concurrently: backend (wrangler dev) + frontend (vite)
npm run dev:backend             # backend only
npm run dev:frontend            # frontend only
npm run build                   # build frontend + backend
npm run test                    # frontend + backend vitest
npm run lint                    # eslint both workspaces
npm run typecheck               # tsc --noEmit both workspaces
```

### Backend (run with --workspace=backend)
```bash
npm run db:migrate              # prisma migrate dev (local sqlite)
npm run db:seed                # seed 12 products
npm run db:seed:admin         # seed admin user
npm run db:studio             # prisma studio
npm run test --workspace=backend
```

### Frontend (run with --workspace=frontend)
```bash
npm run dev --workspace=frontend
npm run build --workspace=frontend
npm run test --workspace=frontend
```

> **Cloudflare note**: backend runs on Workers. Local dev uses `wrangler dev`
> with a local D1 sqlite. Never run `tsc` directly — use `npm run typecheck`.

## Code Conventions

### TypeScript (all packages)
- **Strict mode** is on everywhere. No `any` in committed code.
- Prefer `const` over `let`; early returns over `else`; ternaries over reassignment.
- Rely on inference; annotate only for exports or clarity.
- Functional array methods (`map`/`filter`/`flatMap`) over loops.

### Frontend (React)
- Functional components + hooks only. No class components.
- **Zustand** for state (see `frontend/src/store/`). Cart state persists in
  IndexedDB via Dexie (`frontend/src/store/db.ts`) and syncs to backend when online.
- PWA: offline-first; Workbox caching in `vite.config.ts`. Service worker must
  handle the offline cart queue.
- Tailwind for styling; custom palette is the "Letterpress Atelier" warm paper-ink theme.

### Backend (Hono)
- Routes live in `backend/src/routes/*.ts`, all under `/api/*`.
- **Middleware chain order**: `requestId` → `rateLimiter` → `auth` → `validation` → handler.
- Never leak raw DB errors to the client (`errorHandler.ts` maps them).
- All DB access through Prisma (`getPrisma()` factory in `lib/prisma.ts`, D1 adapter).
- **CRITICAL SECURITY RULE**: never trust frontend prices. `/api/cart/sync` and
  `/api/orders` re-validate every price/stock against the database.
- JWT auth is RS256 via `jose` (`lib/jwt.ts`). Sessions cached in KV (`lib/cache.ts`).

### Database (Prisma + D1/SQLite)
- Schema: `backend/prisma/schema.prisma` (User, Session, Address, Wishlist,
  Product, Order, OrderItem, AdminLog).
- Migrations: `prisma/migrations/` (local) and `backend/migrations/` (D1 prod).
- Monetary values are `Float` (LKR). Order IDs are auto-increment.
- Soft deletes via `isActive` flag where applicable.

## Key Files (entry points)

| Concern | File |
|---|---|
| Backend entry | `backend/src/worker.ts` |
| Frontend entry | `frontend/src/main.tsx`, `frontend/src/App.tsx` |
| Shared types | `shared/src/types/index.ts` |
| Shared validators | `shared/src/validators/index.ts` |
| Shared constants | `shared/src/constants/index.ts` (WhatsApp number, tax, templates) |
| API client | `frontend/src/api.ts` |
| Cart store | `frontend/src/store/cartStore.ts` |
| Auth store | `frontend/src/store/authStore.ts` |
| Auth middleware | `backend/src/middleware/auth.ts` |

## Commit / PR Style

Conventional commits enforced by `commitlint.config.js`:
`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`.
Example: `feat(cart): add offline sync with IndexedDB`. Branch names: short, hyphenated,
no `feat/` prefix (e.g. `fix-scroll-state`).

## Security Must-Nots

- Never commit `.env`, JWT keys, or secrets. (`backend/jwtRS256.key*` are present
  in repo only for local dev — do not treat them as safe to publish.)
- Never trust client-submitted prices, quantities, or totals.
- CORS must stay locked to the production domain.
- Rate-limit order creation and auth endpoints.

## Knowledge Graph

A Graphify knowledge graph lives in `graphify-out/` (`graph.html` for browsing,
`graph.json` for agent queries, `GRAPH_REPORT.md` for the architectural summary).
Regenerate after structural changes with `graphify update .` (no LLM cost). The graph
surfaces "god nodes" like `getPrisma()` (46 edges), `CacheKeys`, `useCartStore`,
and `Api` — start there when tracing architecture.

## Before You Edit

1. Read `CONTEXT.md` for domain/business-logic context.
2. Run `npm run typecheck` and `npm run test` after changes.
3. Match existing code style (see `.editorconfig`, `.prettierrc`, `eslint.config.js`).
