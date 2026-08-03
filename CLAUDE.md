# fakturcho

Bulgarian invoicing app. Before changing anything, read in this order:

1. `prompt/CLAUDE.md` — the invariant rules. They apply to every change, every phase, every worker.
2. `prompt/SPEC.md` — the product spec; §Invariants are the acceptance tests.
3. `prompt/PLAN.md` — phases, lanes, gates. A phase does not open until the previous gate is green.

Orchestration model: `prompt/00-KICKOFF.md`.

The gate for every commit: `pnpm lint && pnpm typecheck && pnpm test` (husky enforces it).
