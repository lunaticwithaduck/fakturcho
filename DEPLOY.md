# Deploying fakturcho to Railway

One Railway project, three services:

| Service | Source | Purpose |
| --- | --- | --- |
| Postgres | Railway managed database | data |
| `fakturcho-api` | `server/Dockerfile` | NestJS API + PDF renderer (Chromium) |
| `fakturcho-app` | `app/Dockerfile` | Next.js product |

`backoffice/` is **not** deployed — see the note at the end.

Both Dockerfiles build from the **repo root** as context (they need
`packages/shared-types` and, for the app, `design/`). They copy only explicit
paths, so local artifacts (`node_modules`, `.next`, `.env`) never enter an image.

## 1. Project and database

1. Create a Railway project.
2. **Create → Database → PostgreSQL**. Nothing to configure; you will reference
   its `DATABASE_URL` from the API service.

## 2. API service (`fakturcho-api`)

1. **Create → GitHub Repo** → select this repository.
2. In service **Settings**:
   - **Root Directory**: `/` (default — leave it).
   - **Config-as-code file path**: `server/railway.json`. This supplies the
     builder (`DOCKERFILE`, `server/Dockerfile`), the `/api/health` healthcheck
     and the ON_FAILURE restart policy. Both this and Root Directory are
     UI-only settings.
3. **Settings → Networking → Generate Domain** (or attach a custom domain).
   Do this before configuring the app service — three values below depend on
   the API's public URL.
4. Variables:

| Variable | Example | Where it comes from |
| --- | --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway reference to the Postgres service |
| `PORT` | — | injected by Railway automatically; do not set (the server listens on it) |
| `DUAL_DISPLAY_UNTIL` | `2026-12-31` | date the dual EUR/BGN display ends (config, not code) |
| `BETTER_AUTH_SECRET` | output of `openssl rand -base64 32` | generate once, keep secret |
| `BETTER_AUTH_URL` | `https://api.fakturcho.bg` | the API service's public URL |
| `APP_ORIGINS` | `https://app.fakturcho.bg` | the app's public URL, exactly (scheme + host, no trailing slash); comma-separate if several |
| `PADDLE_API_KEY` | `pdl_live_apikey_…` | Paddle → Developer Tools → Authentication → API keys |
| `PADDLE_ENVIRONMENT` | `production` | `sandbox` when using sandbox.paddle.com credentials |
| `PADDLE_SUBSCRIPTION_PRICE_ID` | `pri_…` | Paddle Catalog: the recurring subscription price |
| `PADDLE_PRICE_PACK5` | `pri_…` | Paddle Catalog: one-time 5 EUR credit-pack price |
| `PADDLE_PRICE_PACK10` | `pri_…` | Paddle Catalog: one-time 10 EUR credit-pack price |
| `PADDLE_PRICE_PACK25` | `pri_…` | Paddle Catalog: one-time 25 EUR credit-pack price |
| `PADDLE_WEBHOOK_SECRET` | `pdl_ntf…` | secret key of the webhook destination (step 4 below) |
| `RESEND_API_KEY` | `re_…` | Resend → API Keys |
| `EMAIL_FROM` | `Fakturcho <invoices@fakturcho.bg>` | address on a Resend-verified domain |

On boot the container runs `prisma migrate deploy` and then starts the API, so
the first successful deploy creates the schema. The image is large (Chromium
plus its OS dependencies) — that is expected.

### Paddle setup

1. Paddle → Catalog → Products: create the subscription product with one
   recurring price, and the credit packs as one-time prices at 5, 10 and 25 EUR.
   Copy the four `pri_…` ids into the variables above.
2. Developer Tools → Notifications → New destination:
   - URL: `https://<api-domain>/api/billing/webhook`
   - Subscribe to transaction and subscription events.
   - Copy the destination's secret key into `PADDLE_WEBHOOK_SECRET`.
3. `PADDLE_ENVIRONMENT` must match where the API key and prices were created
   (`production` vs `sandbox`).

### Resend setup

1. Resend → Domains → add your sending domain and create the DNS records it
   asks for; wait until verified.
2. Create an API key → `RESEND_API_KEY`.
3. `EMAIL_FROM` must use the verified domain.

## 3. App service (`fakturcho-app`)

1. **Create → GitHub Repo** → same repository, second service.
2. **Settings → Config-as-code file path**: `app/railway.json`
   (builder `DOCKERFILE`, `app/Dockerfile`, healthcheck `/login`, ON_FAILURE
   restarts). Root Directory stays `/`.
3. Variables:

| Variable | Example | Where it comes from |
| --- | --- | --- |
| `SERVER_URL` | `https://api.fakturcho.bg` | the API service's public URL |
| `PORT` | — | injected by Railway automatically; do not set |

**`SERVER_URL` is read at build time.** The `/api/*` rewrite in
`app/next.config.ts` is resolved during `next build` and baked into the
standalone output; the Dockerfile declares `ARG SERVER_URL` so Railway passes
the service variable into the build. Set it **before the first build**, and
after changing it trigger a **rebuild** (redeploying the old image is not
enough).

Alternative: keep API traffic inside the project by setting `PORT=3001`
explicitly on the API service and using
`SERVER_URL=http://<api-service-name>.railway.internal:3001`.

The app's `/` redirects to `/documents`, and Railway healthchecks require an
HTTP 200 — hence the healthcheck lives on `/login`.

## 4. Custom domains — order of operations

1. Attach the API domain first. Update `BETTER_AUTH_URL` and the Paddle
   webhook URL to it.
2. Attach the app domain. Update `APP_ORIGINS` on the API to exactly that
   origin (otherwise every signup/login fails with an origin error).
3. Update `SERVER_URL` on the app to the API domain and rebuild the app.
4. Variable changes redeploy the API automatically; only the app needs an
   explicit rebuild when `SERVER_URL` changes.

## 5. First-deploy smoke test

1. Open the app URL — you are redirected to the Bulgarian login screen.
2. Sign up with a fresh email, then log in.
3. Complete the issuer profile (company name, EIK, address, bank details) —
   issuing is blocked until the profile is complete.
4. Create a document, add a line item, issue it.
5. Open the issued document — the PDF must render in the viewer with Cyrillic
   text (Noto Sans ships inside the API image).
6. `https://<api-domain>/api/health` returns 200.

## Local image builds

From the repo root:

```
docker build -f server/Dockerfile -t fakturcho-api .
docker build -f app/Dockerfile --build-arg SERVER_URL=http://localhost:3001 -t fakturcho-app .
```

Run them with the env from `server/.env.example` (API) and a `PORT` (both):

```
docker run --rm -p 3001:3001 -e PORT=3001 --env-file server/.env fakturcho-api
docker run --rm -p 3000:3000 -e PORT=3000 fakturcho-app
```

The app build needs network access (`next/font` downloads Inter at build time).

## Why backoffice is not deployed

`backoffice/` is the sanctioned first pass from `prompt/CLAUDE.md`: every
screen reads seeded mock data, its login is a hardcoded placeholder and the
server has no admin module behind it. Deploying it would expose a fake admin
surface with no real authentication. It stays local until a server-side admin
module and real admin auth exist.
