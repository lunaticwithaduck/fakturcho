# Handoff

State as of 2026-08-09. Phases 1–9 of `prompt/PLAN.md` are complete and gated:
the MVP (1–6), credits billing (8, SPEC §11, invariants 20–23) and deployment
(9, Railway). The app is **live in production** and a full signup → issue →
render transaction has been verified against it.

The authoritative documents are still `prompt/CLAUDE.md` (rules), `prompt/SPEC.md`
(product + the 23 invariants) and `prompt/PLAN.md` (phases). `DEPLOY.md` is the
deployment runbook. GitHub: `github.com/lunaticwithaduck/fakturcho`
(`develop` = `main`).

## Production

Railway project `fakturcho` (id `96cc0007-8a18-43bc-b64e-39b55997d449`), one
environment, three services:

- **api** — `https://api-production-9b4c.up.railway.app` (health: `/api/health`)
- **app** — `https://app-production-df6f.up.railway.app` (the product)
- **Postgres** — referenced by the api as `${{Postgres.DATABASE_URL}}`

Redeploy from the repo root: `railway up --service api --detach` /
`--service app`. The Dockerfile per service is selected by the
`RAILWAY_DOCKERFILE_PATH` service variable, not by railway.json (the
config-file path is a UI-only setting). `BETTER_AUTH_SECRET` in production is
a real generated secret. **Paddle and Resend keys are placeholders** — buying
credits and sending email are the only two flows that don't work yet; see
§Paddle below. A smoke account exists in prod: `smoke@fakturcho.bg` /
`smoke-test-12345` (holds invoice № 1 of its series).

## Billing model (SPEC §11)

- Issuing any document costs **0,10 €**, deducted atomically inside the
  issuance transaction, before the number claim. Insufficient balance → 402
  `INSUFFICIENT_CREDITS`, no number claimed, document stays draft.
- Credit packs 5/10/25 € = one-time Paddle purchases, fulfilled idempotently
  on `transaction.completed` (unique `paddleTransactionId` on the ledger).
- Signup grants 1,00 € once, in the account-creation transaction. No more
  auto-trial subscription; a subscription (bought) = unlimited issuing.
- `account.creditBalanceCents` always equals the ledger sum and is
  CHECK-constrained ≥ 0 at the database.

## Paddle — the missing piece (needs a human)

1. Create a Paddle account (sandbox first), then in the dashboard create four
   prices: one recurring subscription and three one-time (5, 10, 25 EUR).
2. Create a webhook destination →
   `https://api-production-9b4c.up.railway.app/api/billing/webhook`,
   subscribe to `transaction.completed` + the three `subscription.*` events.
3. Put the real values into the api service:
   `railway variables --service api --set PADDLE_API_KEY=... --set
   PADDLE_WEBHOOK_SECRET=... --set PADDLE_SUBSCRIPTION_PRICE_ID=pri_... --set
   PADDLE_PRICE_PACK5=pri_... --set PADDLE_PRICE_PACK10=pri_... --set
   PADDLE_PRICE_PACK25=pri_...` (add `PADDLE_ENVIRONMENT=production` when
   leaving sandbox) and redeploy the api.
4. Same idea for Resend: verify a sending domain, set `RESEND_API_KEY` and
   `EMAIL_FROM`.

## Running it locally

```
docker compose -f server/docker-compose.yml up -d     # Postgres on :54129
pnpm install
pnpm --filter @fakturcho/shared-types build
pnpm --filter @fakturcho/server exec prisma migrate deploy
pnpm --filter @fakturcho/server dev                   # API on :3001
pnpm --filter @fakturcho/app dev                      # product on :3000
pnpm --filter @fakturcho/backoffice dev               # admin on :5173
```

Local demo account: `demo@fakturcho.bg` / `demo12345` (in the Docker volume
`server_fakturcho-db-data`; it got the retroactive 1,00 € grant).
Backoffice login is still the hardcoded placeholder `admin@fakturcho.bg` /
`admin`.

## Gates

```
pnpm lint         # biome + scripts/lint-tokens.cjs
pnpm typecheck    # all five packages
pnpm test         # server vitest (227) + app vitest (118)
pnpm --filter @fakturcho/app test:e2e   # Playwright, mobile + desktop
```

Husky runs lint + typecheck + test on every commit. All 23 SPEC invariants
have Testcontainers-backed tests, including concurrency for numbering (2) and
credit deduction (21).

## Things that will bite you

Everything from the MVP handoff still holds; the reasoning lives in git
history if you need it. Short list plus the new ones:

- **Never `import type` a class you inject into a Nest constructor** — DI
  resolves `undefined` at runtime while unit tests stay green. Guarded by
  `app-boot.smoke.spec.ts`; keep it passing.
- **Better-Auth `trustedOrigins`** — driven by `APP_ORIGINS`; must exactly
  match the app's public origin or every signup/login fails.
- **`SERVER_URL` is baked into the app at BUILD time** (Next rewrites are
  serialized into `routes-manifest.json`). Changing it needs a rebuild of the
  app image, not a restart.
- **Windows reserves ephemeral port ranges after reboots** — that's why local
  Postgres moved 54329 → 54129. If compose ever fails with "socket access
  forbidden", check `netsh interface ipv4 show excludedportrange protocol=tcp`.
- **Prisma `upsert` is not atomic** — number claiming and credit deduction
  both use raw guarded SQL inside one transaction. Do not "simplify" them.
- **The credit charge must precede the number claim** in the issuance
  transaction, so a failed charge never burns a number (invariant 20).
- **Webhook fulfilment is idempotent per `paddleTransactionId`** — a P2002 on
  the ledger insert means "already processed", not an error.

## Open ends

- **Paddle + Resend keys** (above) — the only blockers to full functionality.
- **Backoffice** still runs on mock data with fake auth and is deliberately
  not deployed (`DEPLOY.md` explains).
- **`vatIncluded`** still not exposed in the composer; server supports it.
- **Custom domain** — both services run on `*.up.railway.app`; when a real
  domain lands, update `APP_ORIGINS`, `BETTER_AUTH_URL`, `SERVER_URL`
  (rebuild) and the Paddle webhook URL.
- **No CI** — gates run locally via husky; GitHub Actions would be the next
  step.
- Phase 7 `[LATER]` scope (reminders, recurring, templates, reporting)
  remains unbuilt by design.

## Rules worth restating

An issued document is immutable and corrected only by a credit or debit note.
Numbers are claimed at issuance inside a transaction and never reused; the
credit charge lives in that same transaction. Rendering reads frozen snapshot
columns only. There is exactly one renderer. Money is integer cents everywhere
except the render boundary. All user-facing copy is Bulgarian.
