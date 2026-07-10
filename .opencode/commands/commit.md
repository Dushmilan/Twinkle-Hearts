---
description: Review staged changes, run graphify update, and commit with conventional message
agent: build
---

You are performing a commit workflow for Twinkle-Hearts.

Steps:
1. Run `graphify update .` to refresh the knowledge graph.
2. Show `git diff --cached` and `git status` to the user.
3. Review the staged diff in **caveman-review** style:
   - Terse one-line format: `L<line>: <severity>: <problem>. <fix>.`
   - Use severity prefixes: 🔴 `bug` / 🟡 `risk` / 🔵 `nit` / ❓ `q`
   - No throat-clearing, no "I noticed that..."
4. Present the review and ask the user to confirm or make changes.
5. On confirmation, stage any remaining changes and commit:
   ```
   git commit -m "<conventional message per commitlint>"
   ```
6. Run `graphify update .` again after the commit.
