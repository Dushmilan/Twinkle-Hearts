# Deployment Architecture

## Frontend → Backend Communication

### Local Development
- **Vite proxy** in `frontend/vite.config.ts` forwards `/*/api` requests from `localhost:5173` → `localhost:8787`
- No CORS issues (same-origin via proxy)
- No env vars needed — run `npm run dev` from root to start both

### Production (Cloudflare)
- **Pages** builds from `frontend/` directory
- `VITE_API_URL` env var (set in Pages dashboard) = `https://twinkle-hearts-api.dushmilan05.workers.dev`
- React app makes direct fetch calls to the Worker URL
- **Worker CORS** (`backend/wrangler.toml`): `CORS_ORIGIN = "https://twinkle-hearts.pages.dev"`

### Troubleshooting
- 405 on `/api/*` → Pages has no handler for the route (check build config)
- CORS error → Worker CORS_ORIGIN doesn't match the frontend origin
- 404 on Worker routes → Worker not deployed or route not matching
