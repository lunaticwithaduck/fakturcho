# Handoff

State as of 2026-08-09, end of day. Continuing from the Mac — this file is the
resume point. Phases 1–9 of `prompt/PLAN.md` complete and gated; product is
live in production with credits billing (SPEC §11, invariants 20–23 tested).

- **App**: https://www.fakturcho.com (canonical, TLS valid, auto-renews) —
  also https://app-production-df6f.up.railway.app
- **API**: https://api-production-9b4c.up.railway.app (`/api/health`)
- **GitHub**: `lunaticwithaduck/fakturcho`, `develop` = `main`, both current
- **Railway**: project `fakturcho` (`96cc0007-8a18-43bc-b64e-39b55997d449`),
  env `production` (`74c6f0c7-66e7-4aa9-a6df-424a79e9ed16`), services
  `api` (`fd2cfd96-4b4b-49a3-b220-00199b63d148`), `app`
  (`ce421bcf-b741-4840-8d40-d91cc23abc73`), `Postgres`

Verified in production end-to-end: signup → 1,00 € grant → issuer profile →
issue (0,10 € deducted atomically, gapless number) → Chromium PDF with
Cyrillic filename. Smoke account: `smoke@fakturcho.bg` / `smoke-test-12345`
(balance 90 cents, holds invoice № 1 of its series).

## The open thread — do these in order

1. **Paddle: set the default payment link** (THE checkout blocker). Checkout
   creation returns Paddle error `transaction_default_checkout_url_not_set`.
   In the Paddle **sandbox** dashboard → Checkout → Checkout settings: if a
   Paddle-hosted checkout option exists, enable it (zero code). Otherwise set
   the default payment link to `https://www.fakturcho.com/billing`, create a
   **client-side token** (Developer Tools → Authentication), and wire the
   Paddle.js overlay into the billing feature: script include + initialize
   with the token and `environment: 'sandbox'`; Paddle.js auto-opens the
   checkout for the `_ptxn` query param that the redirect lands with. Token
   goes in as `NEXT_PUBLIC_...` env — remember `SERVER_URL`-style build-time
   baking applies to `NEXT_PUBLIC_*` too: set the var, rebuild the app.
2. **Run the first real purchase test**: sign in as the smoke account on
   `/billing`, buy the 5 € pack, pay with Paddle's sandbox card
   `4242 4242 4242 4242` (any future expiry, any CVC). Expect: webhook 200 in
   Paddle's notification log, balance 90 → 590 cents, a `purchase:+500`
   ledger row. That closes the loop: checkout → payment → webhook →
   idempotent fulfilment.
3. **Install the Railway GitHub App** on the repo (Railway dashboard → api
   service → Settings → Source → Configure GitHub App). Until installed,
   pushes do NOT auto-deploy and Railway's view of `main` goes stale —
   trigger builds by explicit SHA:
   `railway api 'mutation { serviceInstanceDeployV2(serviceId: "<id>", environmentId: "74c6f0c7-66e7-4aa9-a6df-424a79e9ed16", commitSha: "<full 40-char sha>") }'`
4. **Repo → private** — only AFTER step 3, or Railway loses repo access
   (today's builds work only because the repo is public).
   `gh repo edit lunaticwithaduck/fakturcho --visibility private`
5. **GoDaddy forwarding** for the apex: Domain Portfolio → fakturcho.com →
   Forwarding → `https://www.fakturcho.com`, 301. (GoDaddy has no ALIAS, so
   the apex can't CNAME to Railway; `https://` on the bare apex will not have
   a cert — GoDaddy limitation, Cloudflare DNS is the fix if it ever
   matters. The apex custom domain entry on Railway is left registered but
   dormant.)
6. **Resend**, whenever email matters: verify a sending domain, set
   `RESEND_API_KEY` + `EMAIL_FROM` on the api service.

## Production configuration

All secrets live ONLY in Railway service variables — nothing sensitive is in
this repo. Read them with `railway variables --service api`. Facts worth
knowing:

- Paddle **sandbox** is fully configured: products „Fakturcho кредити“
  (pack5/pack10/pack25 one-time EUR prices, quantity locked 1, tax-inclusive)
  and „Fakturcho абонамент“ (5 €/month recurring); webhook destination →
  `/api/billing/webhook` with the four events; API key + webhook secret +
  four price IDs deployed on the api service. **The Paddle API key expires
  2026-11-07** (90-day default) — rotate before then.
- `APP_ORIGINS` currently trusts `https://fakturcho.com`,
  `https://www.fakturcho.com` and the Railway app domain.
- `RAILWAY_DOCKERFILE_PATH` selects the Dockerfile per service (config-file
  path is a UI-only setting; the committed `railway.json`s are documentation
  until set in the UI).
- `SERVER_URL` (api URL) is baked into the app at BUILD time — changing it
  requires an app rebuild, not a restart.
- Going to Paddle production later: new API key/webhook secret/price IDs from
  the live dashboard, `PADDLE_ENVIRONMENT=production`, webhook URL re-created
  against the live account.

## Resuming on the Mac

```
git clone https://github.com/lunaticwithaduck/fakturcho && cd fakturcho
nvm use            # .nvmrc → Node 22; corepack enable for pnpm
pnpm install
docker compose -f server/docker-compose.yml up -d   # Postgres :54129
pnpm --filter @fakturcho/shared-types build
pnpm --filter @fakturcho/server exec prisma migrate deploy
railway login && railway link -p 96cc0007-8a18-43bc-b64e-39b55997d449 -e production
gh auth login
```

Docker Desktop is needed for the Testcontainers suite (`pnpm test`). The
Railway CLI sometimes drops the directory link — re-run `railway link -p ...`
or use `railway api '<graphql>'`, which needs no link. The seeded demo data
from the Windows machine lives in a local Docker volume there; on the Mac,
sign up fresh or re-seed via the public API (the old seed script only used
public endpoints).

## Gates

```
pnpm lint && pnpm typecheck && pnpm test    # husky runs this on commit
pnpm --filter @fakturcho/app test:e2e       # Playwright, mobile + desktop
```

227 server tests (all 23 SPEC invariants on Testcontainers Postgres,
concurrency included) + 118 app tests + 1 e2e spec.

## Things that will bite you

- **Never `import type` a class you inject into a Nest constructor** — DI
  resolves `undefined` at runtime, unit tests stay green. Guarded by
  `server/src/testing/app-boot.smoke.spec.ts`; keep it passing.
- **Better-Auth `trustedOrigins`** — `APP_ORIGINS` must exactly match the
  browser origin or every signup/login fails with `Invalid origin`.
- **The credit charge precedes the number claim** in one transaction
  (invariant 20) — a failed charge never burns a number. Deduction is a raw
  guarded UPDATE; do not "simplify" to read-then-write (invariant 21).
- **Webhook fulfilment is idempotent** per `paddleTransactionId` — P2002 on
  the ledger insert means already-processed, not an error (invariant 22).
- **Prisma `upsert` is not atomic** — numbering uses raw
  `INSERT ... ON CONFLICT` + `SELECT ... FOR UPDATE`.
- **Checkout flow expects Paddle's default payment link** — until it is set,
  `POST /api/billing/checkout` 500s with
  `transaction_default_checkout_url_not_set` (visible via the Paddle SDK log
  line in `railway logs --service api`).
- **`serviceInstanceDeployV2` without `commitSha` deploys Railway's stale
  view of the branch** (no GitHub App = no push webhooks). Pin the SHA.
- **Windows only**: local Postgres moved 54329 → 54129 because Windows
  reserves ephemeral port ranges after reboots
  (`netsh interface ipv4 show excludedportrange protocol=tcp`). Irrelevant
  on the Mac.

## Open ends (unchanged by design)

- Backoffice: mock data + hardcoded auth, deliberately not deployed.
- `vatIncluded` not exposed in the composer; server supports and tests it.
- No CI — gates are husky-local. GitHub Actions is the natural next step.
- Phase 7 `[LATER]` scope (reminders, recurring, templates, reporting).

## Rules worth restating

An issued document is immutable; corrections are credit/debit notes. Numbers
are claimed at issuance inside a transaction, never reused; the credit charge
lives in that same transaction. Rendering reads frozen snapshots only; there
is exactly one renderer. Money is integer cents everywhere except the render
boundary. All user-facing copy is Bulgarian. Stripe is excluded — Paddle only.
