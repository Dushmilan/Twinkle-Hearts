# Graphify-First Code Exploration

When exploring the codebase, always use the graphify knowledge graph first.

## Required Workflow

1. **Check graph freshness**: Compare `git rev-parse HEAD` against the commit hash in `graphify-out/GRAPH_REPORT.md`. If stale, run `graphify update .` first.

2. **Query the graph first**: Before using grep/glob/read, load `graphify-out/graph.json` and `graphify-out/GRAPH_REPORT.md` to:
   - Find the correct files via connected components
   - Identify god nodes and community hubs (core abstractions)
   - Trace cross-module dependencies without raw file hunting

3. **Fall back to grep/glob** only for precise line-level searches (specific symbol definitions, inline patterns).

## Why

The graph surface relationships that raw text search misses — indirect calls, cross-community bridges, and import cycles — saving tokens and time during exploration.
