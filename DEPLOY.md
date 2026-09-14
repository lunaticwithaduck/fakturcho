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
| `EMAIL_FROM` | `Fakturcho <invoices@fakturcho.com>` | address on a Resend-verified domain |

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

### Romania (ANAF e-Factura)

| Variable | Example | Where it comes from |
| --- | --- | --- |
| `ANAF_ENVIRONMENT` | `test` | `test` talks to `api.anaf.ro/test`, `prod` to `api.anaf.ro/prod` — `test` is safe to point the dev stack at, it never reaches a real taxpayer's SPV |
| `ANAF_CLIENT_ID` | — | ANAF OAuth app registration (below) |
| `ANAF_CLIENT_SECRET` | — | same registration |
| `ANAF_REFRESH_TOKEN` | — | one-time authorization-code exchange (below) |

ANAF has no service-account flow: every credential traces back to a person's
qualified digital certificate with an SPV PJ role (legal representative,
delegate, or proxy) for the issuing company. jojo has to do the following by
hand, once per CIF:

1. Register the app once at https://www.anaf.ro/InregOauth ("Editare profil
   Oauth" → "Generare Client ID", service `E-Factura`, any callback URL —
   Postman's `https://oauth.pstmn.io/v1/callback` works if there's no public
   redirect URI yet). This yields `ANAF_CLIENT_ID` / `ANAF_CLIENT_SECRET`.
2. Run the OAuth2 authorization-code flow once, in a browser that has the
   certificate installed: authorize at
   `https://logincert.anaf.ro/anaf-oauth2/v1/authorize` with that client id,
   pick the certificate when prompted, then exchange the returned code at
   `https://logincert.anaf.ro/anaf-oauth2/v1/token` (client id/secret as HTTP
   Basic auth) for an access token and a refresh token. Postman's built-in
   OAuth2 helper does both steps; see
   `server/src/einvoice-adapters/ro/ANAF.md` for the exact request shapes.
3. `ANAF_REFRESH_TOKEN` is that refresh token — valid 365 days, and each use
   returns a new one, so it needs rotating (by hand, same flow) before it
   expires. The access token this adapter uses day-to-day is derived from it
   automatically and cached in memory.
### Italy (SDI)

FatturaPA has no PEPPOL path — every invoice to an Italian counterparty goes
through the Sistema di Interscambio (SdI) over the SDICoop channel, and
direct accreditation to SDICoop is the only official transmission route (no
private intermediary bypasses it; an "intermediario" is just another
accredited transmitter). Full protocol detail and citations:
`server/src/einvoice-adapters/it/SDI.md`.

1. Accreditation is done on **https://www.fatturapa.gov.it**, under the
   channel-accreditation procedure ("Fatture e Corrispettivi" → accreditation
   for SDICoop). It requires: a PEC (or equivalent certified-mail) address, a
   subscribed "accordo di servizio", and the endpoints of your own
   `TrasmissioneFatture` callback service (where SdI pushes delivery/rejection
   notifications back). After submission SdI runs interoperability
   ("qualificazione") tests against your system, then issues the **client
   certificate** used to authenticate every subsequent call.
2. **The test endpoint (`testservizi.fatturapa.it`) is not a public sandbox**
   — it only accepts calls from parties who completed the accreditation above
   and hold test credentials for it. There is no anonymous way to try
   SDICoop before accrediting.
3. Once accredited, put the certificate material in the API service's env
   (see `server/.env.example`): `SDI_ENVIRONMENT`, `SDI_CLIENT_CERT_PEM`,
   `SDI_CLIENT_KEY_PEM`, `SDI_CA_PEM` (each PEM, literal or base64), and
   `SDI_SENDER_VAT`, the accredited sender's own VAT/fiscal identifier used to
   build the `RiceviFile` filename.
4. `SdiTransport.checkStatus` is intentionally unimplemented — SdI has no
   status-query operation, it pushes outcomes to the `TrasmissioneFatture`
   callback endpoint declared during accreditation. Building that receiver
   and wiring RC/NS/MC/NE/DT/AT notifications into document status is a
   follow-up, not part of this adapter.
### France (Chorus Pro)

Chorus Pro is B2G only — French public-sector recipients. There is no PDP
wired up for French B2B (see `server/src/einvoice-adapters/fr/CHORUSPRO.md`);
`CHORUSPRO_*` vars are optional and the transport is simply unconfigured
until they're set.

1. Create a PISTE account at https://developer.aife.economie.gouv.fr,
   choosing the **"Universal"** organization so the Chorus Pro APIs show up
   in the catalog.
2. Declare an **application** in the PISTE portal to get an OAuth2
   `client_id` / `client_secret` pair for the sandbox (qualification)
   environment → `CHORUSPRO_CLIENT_ID` / `CHORUSPRO_CLIENT_SECRET`. A second
   pair is issued once qualification tests pass and you request production
   access.
3. Inside Chorus Pro itself (portail.chorus-pro.gouv.fr, not PISTE), create
   a **technical account** ("compte technique") for your structure with API
   rights enabled → `CHORUSPRO_TECH_LOGIN` / `CHORUSPRO_TECH_PASSWORD`. This
   account authenticates the `cpro-account` header and is unrelated to the
   PISTE login.
4. `CHORUSPRO_ENVIRONMENT=sandbox` targets
   `sandbox-oauth.piste.gouv.fr` / `sandbox-api.piste.gouv.fr` (qualification
   data, safe to test against); `prod` targets `oauth.piste.gouv.fr` /
   `api.piste.gouv.fr` and files real B2G invoices.
### Spain (AEAT Verifactu + FACe)

Every ES invoice is reported to AEAT via Verifactu; a public-body recipient
additionally goes to FACe. Full protocol detail and citations:
`server/src/einvoice-adapters/es/AEAT.md`.

| Variable | Example | Where it comes from |
| --- | --- | --- |
| `AEAT_ENVIRONMENT` | `test` | `test` talks to AEAT's "pruebas" (external test) environment (`prewww1.aeat.es`), `prod` to the real one (`www1.agenciatributaria.gob.es`) |
| `AEAT_CLIENT_CERT_PEM` | — | the certificate below, PEM |
| `AEAT_CLIENT_KEY_PEM` | — | its private key, PEM |
| `AEAT_CA_PEM` | — | optional: an extra CA to trust when verifying AEAT's own TLS certificate |
| `AEAT_ISSUER_NIF` | `B12345674` | the tenant's own NIF/CIF — Verifactu keeps one hash chain per issuer |
| `AEAT_SOFTWARE_NIF` | — | the *software producer's* own NIF (fakturcho's, not the tenant's) |
| `AEAT_SOFTWARE_NAME` | `Fakturcho` | optional, defaults to `Fakturcho` |
| `AEAT_SOFTWARE_VERSION` | `1.0` | optional, defaults to `1.0` |
| `AEAT_SOFTWARE_APP_ID` | `01` | optional 2-character id fakturcho assigns itself, defaults to `01` |
| `FACE_ENVIRONMENT` | `test` | `test` talks to FACe's staging portal (`se-face-webservice.redsara.es`), `prod` to `webservice.face.gob.es` |
| `FACE_SIGNING_CERT_PEM` | — | certificate used to WS-Security-sign every FACe request, PEM |
| `FACE_SIGNING_KEY_PEM` | — | its private key, PEM |

1. **Certificate requirements.** Both Verifactu (TLS client certificate) and
   FACe (WS-Security XML signature) require a *qualified* electronic
   certificate recognised by AEAT/@firma — a personal FNMT "Certificado de
   Representante" for the company, an "apoderado" certificate, or a company
   seal ("sello electrónico") certificate. A self-signed or ordinary TLS
   certificate will not authenticate against either service. The same
   certificate can usually serve both `AEAT_CLIENT_CERT_PEM`/`_KEY_PEM` and
   `FACE_SIGNING_CERT_PEM`/`_KEY_PEM`, but they are separate variables so a
   different certificate can be used per service if AEAT and the FACe
   integration end up under different legal representatives.
2. **The pruebas (test) environment.** AEAT's `AEAT_ENVIRONMENT=test`
   endpoint (`prewww1.aeat.es`) is AEAT's own "Portal de Pruebas Externas" —
   it still requires a real qualified certificate to connect (there is no
   anonymous sandbox), but records submitted there never reach the
   production ledger. FACe's `FACE_ENVIRONMENT=test`
   (`se-face-webservice.redsara.es`) is a separate staging deployment of the
   whole platform with its own DIR3 directory — a public-body recipient must
   be registered there too before a test submission will route anywhere.
3. **DIR3 data a public-body client must supply.** Before invoicing a public
   body, get its three DIR3 codes (each 9 characters — a letter followed by
   8 digits, e.g. `L01280796`) from the client itself or from FACe's own
   directory search: órgano gestor (the contracting/receiving body), unidad
   tramitadora (the unit that processes it) and oficina contable (the
   accounting office that pays it). This adapter has no dedicated field for
   them — set the document's buyer reference to
   `DIR3:<organoGestor>:<unidadTramitadora>:<oficinaContable>` and both the
   Facturae `AdministrativeCentres` block and the FACe routing decision pick
   it up automatically (see `face-dir3.ts`). Getting any of the three codes
   wrong routes the invoice to the wrong desk inside that public body, not a
   rejection FACe can detect on its own.

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

## 8. E-invoice transports

Each issuer country routes to at most one real transport, picked by
`document.issuer.country` in `EinvoiceTransportRegistry.forCountry`
(`server/src/einvoice/transport/transport-registry.ts`). A country with no
registered transport falls back to the Peppol network via `PeppolService`.
Production binds `PEPPOL_TRANSPORT` to `NotConfiguredPeppolTransport`
until a real access-point client is wired up — sending for a Peppol-routed
country then fails honestly with `EINVOICE_TRANSPORT_NOT_CONFIGURED`
instead of pretending to deliver.

Country transports register themselves in
`server/src/einvoice/transport/einvoice-transport.module.ts` — import the
country's module and add its transport class to the token list; the registry
picks it up from `document.issuer.country` automatically. Each transport's
own `isConfigured()` decides whether `/send` proceeds or throws
`EINVOICE_TRANSPORT_NOT_CONFIGURED` naming that provider — no transmission
row is written when a provider is unconfigured. `POST
/api/documents/:id/einvoice/refresh` polls `checkStatus` on providers that
implement it and returns 409 for the ones that don't (Peppol, or any
transport without status polling).

Per-country credentials (API keys, certificates, SFTP/webservice
endpoints) are documented by each country's own worker alongside its
transport implementation.
### Poland (KSeF)

`KsefTransport` (`server/src/einvoice-adapters/pl/ksef-transport.ts`) sends
FA(3) invoices straight to the Ministry of Finance's KSeF 2.0 API — no
intermediary. Full endpoint documentation, with citations, is in
`server/src/einvoice-adapters/pl/KSEF.md`.

Runtime vars (`server/.env.example`):

| Variable | Value |
| --- | --- |
| `KSEF_ENVIRONMENT` | `test`, `demo`, or `prod` |
| `KSEF_NIP` | the 10-digit NIP authenticating to KSeF |
| `KSEF_TOKEN` | a KSeF token generated for that NIP |

### Getting a KSeF token

1. Log into the KSeF web app for the target environment — TEST:
   `https://ksef-test.mf.gov.pl`, DEMO: `https://ksef-demo.mf.gov.pl`, PROD:
   `https://ksef.mf.gov.pl` — with a Trusted Profile (Profil Zaufany),
   qualified signature, or qualified seal for the NIP in question.
2. **Uwierzytelnianie i uprawnienia → Generuj token KSeF** (the exact path
   the Ministry documents at
   [ksef.podatki.gov.pl](https://ksef.podatki.gov.pl)). Pick a permission
   scope that at minimum allows invoice sending (`Faktura – wystawianie`);
   the token is shown once — copy it straight into `KSEF_TOKEN`.
3. TEST accepts self-generated, non-real NIPs (data there isn't isolated
   between integrators, so a made-up 10-digit NIP works for `KSEF_NIP` and
   for the issuer's NIP on the invoice) — point the dev stack at
   `KSEF_ENVIRONMENT=test` and there is no need to touch a real company's
   KSeF account to develop against it. DEMO and PROD require a real NIP with
   a real token generated as above.
## 9. Feature flags

`EN_LOCALE`, `EINVOICE` and `PEPPOL` are not environment variables — they live
in the `feature_flag` table (seeded off by the first migration that creates
it) and are read through `FeatureFlagsService`, cached in memory for a few
seconds. Toggle them at **backoffice → Функции**; a change takes effect
across the API and the app within that cache window, no redeploy needed.
