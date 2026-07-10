---
name: twinkle-deploy
description: Deploy Twinkle-Hearts to Cloudflare Workers (backend) and Pages (frontend), manage D1/KV/R2 bindings, run migrations
license: MIT
compatibility: opencode
---

# Twinkle-Hearts Deployment

Deploy the monorepo to Cloudflare and manage infrastructure bindings.

## When to use
- First-time Cloudflare setup (D1, KV, R2, JWT keys).
- Routine deploy of backend Worker or frontend Pages.
- Running production DB migrations.

## Prerequisites
- `wrangler` installed (it is in `backend/devDependencies`).
- `deploy-cloudflare.ps1` at repo root is the full reference script.
- Cloudflare account authenticated (`wrangler login` or `CLOUDFLARE_API_TOKEN`).

## Backend (Worker + D1 + KV + R2)
```bash
npm run db:migrate:prod --workspace=backend   # prisma migrate deploy on D1
npm run deploy --workspace=backend            # wrangler deploy (reads backend/wrangler.toml)
```
- Bindings are declared in `backend/wrangler.toml` (D1 `DB`, KV namespace, R2 bucket).
- JWT RS256 keys: `backend/jwtRS256.key` / `.pub` are for **local dev only**.
  Prod keys come from `wrangler secret put` (see `deploy-cloudflare.ps1`).

## Frontend (Pages)
```bash
npm run build --workspace=frontend             # tsc + vite build → frontend/dist
# deploy dist to Cloudflare Pages (wrangler pages deploy or dashboard)
```
- `frontend/wrangler.toml` + `frontend/public/_worker.js` route API calls in prod.
- PWA manifest + service worker are emitted by `vite-plugin-pwa`.

## Database migrations (D1)
- Local: `npm run db:migrate --workspace=backend` (sqlite `backend/prisma/dev.db`).
- Prod: `npm run db:migrate:prod --workspace=backend` (applies `prisma/migrations/`).
- D1-specific SQL also in `backend/migrations/` — keep in sync with Prisma migrations.

## Gotchas
- Backend runs on the **Workers runtime**: no Node built-ins, no filesystem.
- Never commit secrets. Use `wrangler secret put` for JWT keys, D1 IDs, KV IDs, R2 creds.
- After schema changes: regenerate client (`npm run db:generate --workspace=backend`)
  and re-run `graphify update .` to refresh the knowledge graph.
