---
description: Run the full Twinkle-Hearts test suite (backend + frontend) and surface failures
agent: build
model: anthropic/claude-haiku-4-5
---

Run the full test suite for Twinkle-Hearts and report any failures.

Steps:
1. Run `npm run test` from the repo root (runs backend + frontend Vitest).
2. If failures appear, run the failing workspace narrowly:
   - `npm run test --workspace=backend`
   - `npm run test --workspace=frontend`
3. Surface the failing test names and the assertion/error. Suggest the minimal fix.
4. Do NOT edit test files unless the failure is a genuine bug in source code —
   in that case, fix the source and re-run.

Keep the summary under 15 lines unless failures require detail.
