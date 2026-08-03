# Plan

## §0 — Decisions (closed 2026-08-03)

All decisions are closed and written into `CLAUDE.md §Stack`. No open choices
remain; workers code against these without re-litigating them.

| # | Decision | Closed as |
|---|---|---|
| 1 | State + server data | RTK + RTK Query, pattern from `~/Documents/repos/backoffice/src/api` |
| 2 | UI primitives | Radix + Tailwind 4; shadcn is a copy-source, never a dependency |
| 3 | `*.styles.ts` mechanism | tailwind-variants |
| 4 | Auth | Better-Auth (same model as majstorbg) |
| 5 | Payments | **Paddle Billing** — Stripe explicitly vetoed; Lemon Squeezy is Stripe-owned and equally out |
| 6 | PDF renderer | Server-side Chromium (Playwright) → PDF from one HTML template |
| 7 | Email | Resend |
| 8 | Lint/format | Biome, not eslint. The token linter is a separate script in `scripts/` |

Spec rulings, closed at the same time:

- **Empty seller block:** issuance requires a complete issuer profile. Without
  one, documents are saveable only as `draft`; issuing returns a domain error.
  No document ever issues with an empty seller block. (SPEC §4, invariant 19.)
- **Dual EUR/BGN:** behind a dated config flag, per SPEC §6.
- **Number override:** honoured only on a series with no issued documents —
  the migration case. Once a series has any, the override is rejected. (SPEC §3.)
- **On-screen viewing** is the generated PDF in a viewer, never a parallel
  HTML layout. (SPEC §8.)

---

## Phases

Each phase ends at a gate. The gate is: token linter clean, typecheck clean,
that phase's tests green, and you have read the diff. No gate, no next phase.

### Phase 1 — Foundation (no workers, you do this)

pnpm workspace + Turborepo, the three app skeletons, `packages/shared-types`
scaffold, the token linter ported from `../majstorbg/scripts`, husky wired.
Nothing renders yet.

**Gate:** `pnpm lint && pnpm typecheck` passes on an empty repo.

### Phase 2 — Contracts (no workers, you do this)

The Prisma schema and `packages/shared-types` in full: entities, enums, DTOs,
API surface. This is the thing every later worker codes against, so it is not
delegated and it is frozen at the gate. Changes after this point are a
deliberate re-freeze that you announce to every open lane.

**Gate:** schema migrates, types compile, you can trace every §1 field to a
column and a type.

### Phase 3 — Design system (1 worker, sequential)

Research prior art, settle a mobile-first visual direction, extract
`design/tokens/`, then build primitives. Runs alone because it defines the
vocabulary everything else uses.

Lane: `design/**`.

**Gate:** token linter passes on the primitives themselves; a primitives page
renders on a 375px viewport and at desktop width.

### Phase 4 — Backend (3 workers, parallel)

| Worker | Lane | Owns |
|---|---|---|
| A | `server/src/documents/**`, `server/src/numbering/**` | Numbering, snapshots, lifecycle, immutability. Invariants 1–8, 19. |
| B | `server/src/money/**`, `server/src/render/**` | Money, formatting, amount-in-words, VAT branch, the renderer. Invariants 9–18. |
| C | `server/src/auth/**`, `server/src/clients/**`, `server/src/catalogue/**`, `server/src/billing/**`, `server/src/email/**` | Auth, CRUD, Paddle, Resend. |

Worker B's amount-in-words function is the single highest-risk unit in the
project. Give it its own prompt, its own test table, and read its output line
by line. Bulgarian numerals have gender agreement that models get wrong
confidently.

**Gate:** all 18 invariants green against a Testcontainers Postgres.

### Phase 5 — Frontend (2 workers, parallel, after phase 4 gate)

| Worker | Lane | Owns |
|---|---|---|
| D | `app/src/api/**`, `app/src/store/**`, `app/src/app/(auth)/**` | API slice, auth flow, subscription gate. |
| E | `app/src/app/(app)/**`, `app/src/features/**` | Composer, document list, client and catalogue screens, empty states, skeletons. |

Worker E starts only after D's API slice is merged — otherwise E invents its own
fetching and you get the mocks you said you did not want.

**Gate:** Playwright walks blank → compose → issue → download PDF, on mobile and
desktop viewports.

### Phase 6 — Backoffice (1 worker)

Ant Design, sidemenu, 4–5 screens after auth: accounts, documents, subscriptions,
usage, one report. Reports mocked at first pass. Lane: `backoffice/**`.

### Phase 7 — [LATER] surface

Reminders, recurring, templates, reporting, multiple visual templates. One
worker each, one at a time, each behind its own gate.

---

## Worker prompt template

```
You are working in <lane paths>. You may read anything in the repo.
You may write only inside your lane. If you need a change outside it, stop and
report.

Rules: <CLAUDE.md verbatim>
Spec: <the one section this lane implements>
Acceptance: <the numbered invariants this lane owns>

Write the tests first. You are done when they pass and the token linter is clean.
Do not write comments. Do not add dependencies without asking.
```
