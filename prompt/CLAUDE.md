# Rules

These hold for the whole repo, every phase, every worker. They are not advice.

## Repo shape

```
app/                 Next.js — the product
server/              NestJS — the API
backoffice/          React + Ant Design — internal admin
packages/
  shared-types/      the contract between all three
design/              tokens + primitives (consumed by app/)
scripts/             the token linter and other repo tooling
```

pnpm workspaces + Turborepo. Node 22 LTS. TypeScript strict everywhere,
`noUncheckedIndexedAccess` on.

## Stack

Closed 2026-08-03. Not open for renegotiation by a worker.

- Server state: RTK + RTK Query, pattern from `~/Documents/repos/backoffice/src/api`.
- UI primitives: Radix + Tailwind 4. shadcn is a copy-source, never a dependency.
- `*.styles.ts`: tailwind-variants.
- Auth: Better-Auth.
- Payments: Paddle Billing. Stripe and Stripe-owned services are excluded.
- PDF: server-side Chromium (Playwright) printing one HTML template.
- Email: Resend.
- Lint/format: Biome. The token linter in `scripts/` is separate and also runs
  on commit.

## Design tokens

- Every colour, spacing step, radius, font size, weight, line height, shadow and
  duration is defined once under `design/tokens/` and consumed by name.
- No raw literals in component code. No `#hex`, no `px`, no `rem`, no arbitrary
  Tailwind values (`w-[13px]`, `text-[#f25c1f]`). The linter in `scripts/`
  enforces this and fails the commit.
- Tokens are emitted as CSS custom properties and mapped into the Tailwind
  theme. Tailwind utilities resolve to tokens; that is the only sanctioned path
  from token to pixel.
- Adding a token is a deliberate act. If a worker needs a value that does not
  exist, it stops and asks — it does not add a token to unblock itself.

## Components

```
design/components/Button/
  Button.tsx        markup + behaviour
  Button.styles.ts  tailwind-variants definition, no JSX
  index.ts          export { Button } from './Button'
```

- `design/components/index.ts` barrels the folder.
- Radix primitives are the behavioural base for anything with state or a11y
  semantics: dialog, popover, select, dropdown, tabs, tooltip, checkbox, radio,
  switch, accordion, toast.
- Import via aliases (`@design/components`, `@app/*`, `@shared/types`). No
  relative paths that climb more than one level.
- Icons: `lucide-react`. Motion: `motion`. Skeletons: a local `Skeleton`
  primitive, not a dependency.

## Code style

- No explanatory comments. Not on functions, not on blocks, not on imports.
  A comment is permitted only where the code is genuinely non-obvious and the
  reason cannot be expressed in a name — a legal citation, a spec clause
  reference, a workaround with a link.
- Documentation goes in `app/docs/`, as prose, and only when it earns its place.
- No file over ~200 lines. Split before that.
- No barrel-free deep imports into `design/`.

## Money

- All monetary values are **integer minor units** (cents) in the database, in
  the API, and in `shared-types`. Never a float. Never a string except at the
  render boundary.
- Formatting to Bulgarian display form (`1 600,00`) happens in exactly one
  module, at the edge. Parsing happens in exactly one module.
- BGN is derived, never stored: `bgn = roundHalfUp(eur * 1.95583, 2)` at the peg.
  The peg lives in one constant.
- The dual EUR/BGN display sits behind a dated config flag; past the date the
  `лв.` line disappears. The date is config, not code.

## Data and state

- Server state: RTK Query only. Following the pattern in
  `~/Documents/repos/backoffice/api` — one API slice, injected endpoints per
  domain, tags for invalidation.
- Client state: Redux Toolkit slices. No Zustand, no Context-as-store.
- No data fetching in components. Hooks only, generated from the API slice.
- No mock data in `app/`. Empty states and skeletons, wired to the real API.
  `backoffice/` may ship mocked reports in its first pass and only there.

## Documents are legal artifacts

- An issued document is immutable. The API rejects mutation of any document not
  in `draft`. This is enforced at the service layer, not the UI.
- Issuance requires a complete issuer profile (SPEC §4). Without one, documents
  save only as `draft`; issuing returns a domain error.
- Numbers are claimed at issuance, inside a transaction, never at creation.
- Issuing costs credit (SPEC §11): the 10-cent deduction happens inside the
  issuance transaction with the number claim — both commit or neither does.
  Accounts with a usable subscription are exempt.
- The next-number override is honoured only on a series with no issued
  documents; afterwards the sequence is fixed.
- Party details are snapshotted onto the document row at issuance. Rendering
  reads the snapshot columns. Rendering must never join to the live issuer
  profile or client row.
- There is exactly one renderer. View, print and download resolve to the same
  generated artifact — in-app viewing is the generated PDF in a viewer. If you
  find yourself writing an on-screen HTML layout of a document alongside the
  print template, you have violated this.

## Tests

- Every invariant in `SPEC.md §Invariants` has a test. Those tests are written
  before the implementation and are the definition of done for their lane.
- `server/`: Vitest + Testcontainers Postgres for anything touching numbering,
  snapshots or money.
- `app/`: Vitest for logic, Playwright for the document composition flow.

## Language

- All user-facing copy is Bulgarian. No English strings in the UI.
- Code, identifiers, commit messages and `app/docs/` are English.
- Dates render `DD.MM.YYYY`. Numbers render with comma decimal, space thousands.
