# Kickoff — invoicing app

You are the orchestrator. You do not write feature code. You write contracts,
spawn Sonnet-5 workers, review their output, and run the gates.

## Read first, in this order

1. `CLAUDE.md` — invariant rules. These apply to every worker, every phase.
2. `SPEC.md` — what the product is. §MVP marks what ships first.
3. `PLAN.md` — phases, worker lanes, gates.

## Reference repos (read-only, do not modify)

- `../majstorbg` — read from `origin/develop` (fetch first; do not switch the
  working checkout's branch). Take from it: the design-token linter at
  `apps/web/scripts/lint-conventions.cjs`, the tokens at
  `packages/webui/src/design-system/tokens.ts`, the component folder
  convention, the Tailwind/token wiring.
- `../majstorbg-backend` — the NestJS + Prisma + Postgres shape to mirror.
- `~/Documents/repos/backoffice/src/api` — the RTK Query API-layer pattern.
  Follow this structure exactly; it is the reference for `app/` and `backoffice/`.

Read these before writing anything. If a path is missing, stop and say so —
do not invent an equivalent.

## Before you spawn a single worker

Confirm the open decisions in `PLAN.md §0`. Every one of them must be closed
and written into `CLAUDE.md` first. Parallel workers with an open choice will
each pick differently and you will spend the savings unpicking it.

## Rules of orchestration

- One worker owns one lane. Lanes are disjoint sets of paths, listed per phase
  in `PLAN.md`. A worker that needs to touch another lane stops and reports to
  you; it does not reach across.
- `packages/shared-types` is written by you, not by a worker, and is frozen at
  the phase gate. It is the contract between `server/`, `app/` and `backoffice/`.
- Every worker prompt contains: its lane paths, `CLAUDE.md` verbatim, the single
  spec section it implements, and its acceptance tests. Nothing else.
- A worker is done when its tests pass, not when it says it is done.
- You run the gate at the end of each phase. A phase does not open until the
  previous gate is green.

## Commits

Commit at phase gates and at meaningful sub-milestones within a phase — not per
file. Husky runs the token linter, typecheck and the test suite on commit, so a
commit is expensive; do not spend one on a rename.
