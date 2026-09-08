# Deploying fakturcho to Railway

One Railway project, four services:

| Service | Source | Purpose |
| --- | --- | --- |
| Postgres | Railway managed database | data |
| `fakturcho-api` | `server/Dockerfile` | NestJS API + PDF renderer (Chromium) |
| `fakturcho-app` | `app/Dockerfile` | Next.js product |
| `fakturcho-backoffice` | `backoffice/Dockerfile` | internal admin (§6) |

All three Dockerfiles build from the **repo root** as context (they need
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
| `REVOLUT_API_KEY` | `sk_...` | Revolut Business → Merchant API → API keys (secret key) |
| `REVOLUT_PUBLIC_KEY` | `pk_...` | Revolut Business → Merchant API → API keys (public key; only needed by the Revolut Checkout widget, not the hosted redirect) |
| `REVOLUT_ENVIRONMENT` | `production` | `sandbox` when using a sandbox-merchant.revolut.com account |
| `REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID` | `pv_…` | Merchant API subscription plan variation id for the 5 €/month plan (see below) |
| `REVOLUT_WEBHOOK_SECRET` | `wsk_…` | signing secret returned when the webhook destination is created (step below) |
| `RESEND_API_KEY` | `re_…` | Resend → API Keys |
| `EMAIL_FROM` | `Fakturcho <invoices@fakturcho.bg>` | address on a Resend-verified domain |

On boot the container runs `prisma migrate deploy` and then starts the API, so
the first successful deploy creates the schema. The image is large (Chromium
plus its OS dependencies) — that is expected.

### Revolut setup

Credit packs need no catalog entry — the amount is sent straight on the order
(500/1000/2500 cents, `@fakturcho/shared-types` `CREDIT_PACKS`). The
subscription needs a plan created once, up front:

1. Create the subscription plan (5 €/month, one variation, no trial, billing
   forever — `cycle_count: null`):
   ```
   curl -X POST https://merchant.revolut.com/api/subscription-plans \
     -H "Authorization: Bearer $REVOLUT_API_KEY" \
     -H "Revolut-Api-Version: 2024-09-01" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Fakturcho абонамент",
       "variations": [{
         "phases": [{
           "ordinal": 1,
           "cycle_duration": "P1M",
           "cycle_count": null,
           "amount": 500,
           "currency": "EUR"
         }]
       }]
     }'
   ```
   Copy the returned `variations[0].id` into `REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID`.
2. Register the webhook destination (once per environment — the production
   one is already registered, id `4695da35-a595-4c9f-b2d6-e3c937646745`;
   PATCH it to add the four `SUBSCRIPTION_*` events rather than creating a
   second destination):
   ```
   curl -X POST https://merchant.revolut.com/api/webhooks \
     -H "Authorization: Bearer $REVOLUT_API_KEY" \
     -H "Revolut-Api-Version: 2024-09-01" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://<api-domain>/api/billing/webhook",
       "events": [
         "ORDER_COMPLETED", "ORDER_AUTHORISED", "ORDER_CANCELLED",
         "SUBSCRIPTION_INITIATED", "SUBSCRIPTION_FINISHED",
         "SUBSCRIPTION_CANCELLED", "SUBSCRIPTION_OVERDUE"
       ]
     }'
   ```
   The response's `signing_secret` (`wsk_…`) goes into `REVOLUT_WEBHOOK_SECRET`
   — it is shown only on creation; rotate it via
   `POST /api/webhooks/{id}/rotate-signing-secret` if it leaks.
3. `REVOLUT_ENVIRONMENT` must match where the API key and plan were created
   (`production` vs `sandbox`) — sandbox and production are separate Revolut
   accounts with separate dashboards and keys.

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

1. Attach the API domain first. Update `BETTER_AUTH_URL` and the Revolut
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

## 6. Backoffice service (`fakturcho-backoffice`)

`backoffice/` is a Vite SPA served by the tiny Node static server in
`backoffice/server.mjs`. It authenticates against the same Better-Auth
instance as `fakturcho-api` and reads `/api/admin/*`, guarded server-side by
`AdminGuard` (`role = 'admin'` on the `user` row).

1. **Create → GitHub Repo** → same repository, third service.
2. **Settings → Config-as-code file path**: `backoffice/railway.json`
   (builder `DOCKERFILE`, `backoffice/Dockerfile`, healthcheck `/login`,
   ON_FAILURE restarts). Root Directory stays `/`.
3. Variables:

| Variable | Example | Where it comes from |
| --- | --- | --- |
| `API_URL` | `https://api.fakturcho.bg` | the API service's URL (internal `http://<api-service-name>.railway.internal:3001` also works and avoids a network hop) |
| `PORT` | — | injected by Railway automatically; do not set |

Leave `VITE_API_URL` **unset** (build arg default `""`). The backoffice never
calls the API cross-origin: `server.mjs` proxies every `/api/*` request to
`API_URL` server-side, the same way `app/next.config.ts`'s `/api/*` rewrite
proxies the product's API calls to `SERVER_URL`. From the browser's point of
view the backoffice and its API calls share one origin, so the Better-Auth
session cookie is always same-site — no `sameSite: 'none'` / cross-site
cookie configuration is needed, on either service. (Setting `VITE_API_URL`
to a build-time URL instead is possible but switches the browser to real
cross-origin requests, which the API's cookies are not configured for —
don't do that in production.)

4. Add the backoffice's public origin to the **api** service's `APP_ORIGINS`
   (comma-separated, alongside the app's origin) — Better-Auth rejects
   sign-in from an untrusted origin.

### Promoting a user to admin

The backoffice has no self-service admin signup — grant `role = 'admin'` by
hand, once, on the production database:

```sql
update "user" set role = 'admin' where email = 'owner@fakturcho.bg';
```

Any existing signed-up user works; a fresh signup always gets `role = 'user'`
(the field is not settable from the signup request).

### First-deploy smoke test

1. Sign up (or reuse an existing app account), run the SQL above against
   that email.
2. Open the backoffice URL → Bulgarian login screen.
3. Sign in with that email/password → lands on **Абонати** with the real
   account list.
4. A non-admin account signs in, is immediately signed back out with
   "Нямате администраторски достъп."

## 7. Umami analytics

Self-hosted, cookieless analytics. Feeds the backoffice **Трафик** page
(`GET /api/admin/analytics/traffic`), which proxies Umami's Stats API. The
integration **fails soft**: unconfigured or unreachable Umami returns a
zeroed, `connected: false` payload and the page shows a clear not-connected
alert — nothing 500s, so this ships before Umami is provisioned.

1. **Postgres** — Railway → New → Database → PostgreSQL (`umami-db`). Umami
   manages its own schema; give it its own database, don't reuse the app one.
2. **Umami service** — Railway → New → Deploy from Docker image:
   - Image: `ghcr.io/umami-software/umami:postgresql-latest`
   - Variables: `DATABASE_URL` = the `umami-db` connection string (Railway
     reference), `APP_SECRET` = `openssl rand -base64 32`, `PORT` = `3000`.
   - Networking → Generate Domain.
3. Open the Umami URL → log in with the default `admin` / `umami` → change
   the password immediately (Settings → Profile).
4. Settings → Websites → Add website. Name `Fakturcho`, domain
   `www.fakturcho.com`. Open it and copy the **Website ID** (a UUID). The
   tracker script is `<umami-url>/script.js`.
5. **App build vars** (`fakturcho-app`, build-time — `NEXT_PUBLIC_*` are
   inlined at build, so set these before the first build and rebuild after
   changing them):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_UMAMI_SRC` | `https://umami-production-2965.up.railway.app/script.js` |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | the website UUID from step 4 |

6. **API runtime vars** (`fakturcho-api`, rotate without a rebuild):

| Variable | Value |
| --- | --- |
| `UMAMI_API_URL` | `https://umami-production-2965.up.railway.app` |
| `UMAMI_WEBSITE_ID` | the website UUID from step 4 |
| `UMAMI_USERNAME` | `admin` (or a dedicated read-only Umami user) |
| `UMAMI_PASSWORD` | that account's password |

`UmamiClient` logs into `POST {UMAMI_API_URL}/api/auth/login` and caches the
bearer token in memory, re-logging in once on a 401. Redeploy the API and
rebuild the app; the Трафик page then shows real numbers.
