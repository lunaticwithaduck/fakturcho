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

1. **Add the subscription plan variation**: create it with the curl in
   `DEPLOY.md` § Revolut setup and set
   `REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID` on the api service — until then
   `POST /api/billing/checkout` with `{"product":"subscription"}` 500s with
   `CHECKOUT_NOT_CONFIGURED`. Credit packs need no such setup, they already
   work.
2. **PATCH the live webhook to add the subscription events**: it is
   registered (id `4695da35-a595-4c9f-b2d6-e3c937646745`) for the order
   events only. Add `SUBSCRIPTION_INITIATED`, `SUBSCRIPTION_FINISHED`,
   `SUBSCRIPTION_CANCELLED`, `SUBSCRIPTION_OVERDUE` or subscription status
   changes never reach the app.
3. **Run the first real purchase test** — this account is live, no sandbox:
   sign in as the smoke account on `/billing`, buy the 5 € pack with a real
   card. Expect: webhook 200, balance 90 → 590 cents, a `purchase:+500`
   ledger row. Refund it straight after with
   `POST https://merchant.revolut.com/api/orders/{order_id}/refund`
   (`amount`/`currency` matching the order) so the test purchase does not
   sit on the account.
4. **Install the Railway GitHub App** on the repo (Railway dashboard → api
   service → Settings → Source → Configure GitHub App). Until installed,
   pushes do NOT auto-deploy and Railway's view of `main` goes stale —
   trigger builds by explicit SHA:
   `railway api 'mutation { serviceInstanceDeployV2(serviceId: "<id>", environmentId: "74c6f0c7-66e7-4aa9-a6df-424a79e9ed16", commitSha: "<full 40-char sha>") }'`
5. **Repo → private** — only AFTER step 4, or Railway loses repo access
   (today's builds work only because the repo is public).
   `gh repo edit lunaticwithaduck/fakturcho --visibility private`
6. **GoDaddy forwarding** for the apex: Domain Portfolio → fakturcho.com →
   Forwarding → `https://www.fakturcho.com`, 301. (GoDaddy has no ALIAS, so
   the apex can't CNAME to Railway; `https://` on the bare apex will not have
   a cert — GoDaddy limitation, Cloudflare DNS is the fix if it ever
   matters. The apex custom domain entry on Railway is left registered but
   dormant.)
7. **Resend**, whenever email matters: verify a sending domain, set
   `RESEND_API_KEY` + `EMAIL_FROM` on the api service.

## Production configuration

All secrets live ONLY in Railway service variables — nothing sensitive is in
this repo. Read them with `railway variables --service api`. Facts worth
knowing:

- Revolut Business Merchant API, **production** (no sandbox account exists;
  the owner decided to go live directly): credit packs are plain orders
  (500/1000/2500 cents, no catalog entry needed), the subscription is a
  Revolut subscription plan variation (`REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID`);
  webhook destination `4695da35-a595-4c9f-b2d6-e3c937646745` →
  `/api/billing/webhook` with `ORDER_COMPLETED`, `ORDER_AUTHORISED`,
  `ORDER_CANCELLED`, `ORDER_PAYMENT_AUTHENTICATED`, `ORDER_PAYMENT_DECLINED`,
  `ORDER_PAYMENT_FAILED` — the four `SUBSCRIPTION_*` events still need adding
  (see the revolut-billing branch report).
- `APP_ORIGINS` currently trusts `https://fakturcho.com`,
  `https://www.fakturcho.com` and the Railway app domain.
- `RAILWAY_DOCKERFILE_PATH` selects the Dockerfile per service (config-file
  path is a UI-only setting; the committed `railway.json`s are documentation
  until set in the UI).
- `SERVER_URL` (api URL) is baked into the app at BUILD time — changing it
  requires an app rebuild, not a restart.

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
- **Webhook fulfilment is idempotent** per `revolutOrderId` — P2002 on
  the ledger insert means already-processed, not an error (invariant 22).
- **Prisma `upsert` is not atomic** — numbering uses raw
  `INSERT ... ON CONFLICT` + `SELECT ... FOR UPDATE`.
- **Subscription checkout needs `REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID`** —
  until it is set, `POST /api/billing/checkout` with
  `{"product":"subscription"}` 500s with `CHECKOUT_NOT_CONFIGURED`. Credit
  packs (`pack5`/`pack10`/`pack25`) need no such setup.
- **`serviceInstanceDeployV2` without `commitSha` deploys Railway's stale
  view of the branch** (no GitHub App = no push webhooks). Pin the SHA.
- **Windows only**: local Postgres moved 54329 → 54129 because Windows
  reserves ephemeral port ranges after reboots
  (`netsh interface ipv4 show excludedportrange protocol=tcp`). Irrelevant
  on the Mac.

## Open ends (unchanged by design)

- Backoffice: real admin API + Better-Auth session auth (`role = 'admin'`
  gate) now wired end-to-end; still not deployed to Railway — see DEPLOY.md
  §6 for the recipe (new service, `API_URL`, `APP_ORIGINS`, promote-to-admin
  SQL). No CI to verify against, so smoke it once before flipping traffic.
- `vatIncluded` not exposed in the composer; server supports and tests it.
- No CI — gates are husky-local. GitHub Actions is the natural next step.
- Phase 7 `[LATER]` scope (reminders, recurring, templates, reporting).

## Rules worth restating

An issued document is immutable; corrections are credit/debit notes. Numbers
are claimed at issuance inside a transaction, never reused; the credit charge
lives in that same transaction. Rendering reads frozen snapshots only; there
is exactly one renderer. Money is integer cents everywhere except the render
boundary. All user-facing copy is Bulgarian. Stripe is excluded — Revolut only.
