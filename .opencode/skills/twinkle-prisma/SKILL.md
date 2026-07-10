---
name: twinkle-prisma
description: Manage the Prisma schema, run/migrate the D1 and local SQLite databases, seed data, and generate the client for Twinkle-Hearts
license: MIT
compatibility: opencode
---

# Twinkle-Hearts Prisma & Database

Manage schema, migrations, seeding, and the Prisma client.

## When to use
- Changing the data model (add/alter models or fields).
- Creating or applying migrations.
- Seeding products or the admin user.
- Debugging DB access (D1 adapter, `getPrisma()`).

## Schema location
- `backend/prisma/schema.prisma` — single source of truth.
- Models: User, Session, Address, Wishlist, Product, Order, OrderItem, AdminLog.
- Monetary values are `Float` (LKR). Order IDs auto-increment. Soft deletes via `isActive`.

## Local dev (SQLite)
```bash
npm run db:migrate --workspace=backend     # prisma migrate dev → backend/prisma/dev.db
npm run db:seed --workspace=backend        # 12 greeting-card products
npm run db:seed:admin --workspace=backend  # admin user
npm run db:studio --workspace=backend      # prisma studio
```

## Production (Cloudflare D1)
```bash
npm run db:generate --workspace=backend    # regenerate client (D1 adapter)
npm run db:migrate:prod --workspace=backend # prisma migrate deploy on D1
```
- D1 SQL mirror lives in `backend/migrations/` — keep in sync with Prisma migrations.

## Prisma client access
- **Always** go through `getPrisma()` in `backend/src/lib/prisma.ts` (D1 adapter).
- Never instantiate `@prisma/client` directly; never use a raw Postgres client
  (Workers runtime has no Postgres driver).

## After schema changes
1. `npm run db:migrate --workspace=backend` (creates migration + updates client).
2. If prod: `npm run db:migrate:prod --workspace=backend`.
3. Re-run `graphify update .` to refresh the knowledge graph.

## Seeding
- `backend/prisma/seed.ts` — 12 products (LKR prices).
- `backend/prisma/seed-admin.ts` — admin credentials (reads env).
- Do not hard-code secrets in seed files; use `.env` / `wrangler secret`.
