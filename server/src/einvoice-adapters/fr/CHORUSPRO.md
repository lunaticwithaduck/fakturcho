# Chorus Pro / PISTE — facts and citations

Researched 2026-09-11 from official/primary sources only. No PISTE or Chorus
Pro call was made — sandbox credentials were never obtained for this task.

## 1. What Chorus Pro is

Chorus Pro is the mandatory portal for **B2G** invoicing in France: every
invoice addressed to the French state, a local authority (collectivité
territoriale) or a public establishment (établissement public) must transit
through it. It is operated by AIFE (Agence pour l'Informatique Financière de
l'État). Source: [impots.gouv.fr — organismes publics, la facturation
électronique avec Chorus
Pro](https://www.impots.gouv.fr/organismes-publics-la-facturation-electronique-avec-chorus-pro-0).

## 2. PISTE and authentication

Since January 2020, API access to Chorus Pro goes through **PISTE**
(Plateforme d'Intermédiation des Services pour la Transformation de l'État),
AIFE's shared API gateway for state/public-sector services. Certificate-based
auth was retired in favour of OAuth2 client-credentials. Sources:
[Communauté Chorus Pro — PISTE
presentation](https://communaute.chorus-pro.gouv.fr/documentation/piste-presentation/?lang=en),
[Communauté Chorus Pro — Help for API developers in OAuth2
mode](https://communaute.chorus-pro.gouv.fr/documentation/help-for-api-developers-in-oauth2-mode/?lang=en).

Steps (per the PISTE user guide linked from the pages above):

1. Create a PISTE account at https://developer.aife.economie.gouv.fr — choose
   the **"Universal"** organization to see the Chorus Pro APIs in the catalog.
2. Declare an **application** in the PISTE portal to obtain OAuth2
   `client_id` / `client_secret` for the sandbox ("bac à sable" /
   qualification) environment. A second application/credentials pair is
   issued for production once the qualification tests pass.
3. Separately, inside Chorus Pro itself (not PISTE), create a **technical
   account** ("compte technique") for your structure with API rights enabled.
   This account is not a PISTE login — it authenticates the Chorus Pro side
   of the call, carried in the `cpro-account` header.

OAuth token endpoint (client_credentials grant, `scope=openid`):

- Production: `https://oauth.piste.gouv.fr/api/oauth/token`
- Sandbox: `https://sandbox-oauth.piste.gouv.fr/api/oauth/token`

(AIFE's own community pages also document direct AIFE-hosted equivalents,
`https://sandbox-oauth.aife.economie.gouv.fr/api/oauth/token` and a
RIE-network variant — same protocol, different host; PISTE is the gateway
used for internet-facing integrations and is what this adapter targets.)

Every Chorus Pro API call carries, in addition to `Authorization: Bearer
<token>`:

- `cpro-account`: base64 of `<technical-login>:<technical-password>`
- `Content-Type: application/json; charset=UTF-8`

## 3. The factures API

Base paths (PISTE-fronted):

- Sandbox/qualification: `https://sandbox-api.piste.gouv.fr/cpro/factures/v1`
- Production: `https://api.piste.gouv.fr/cpro/factures/v1`

Endpoints used here:

- `POST /deposer/flux` — deposit a pre-built structured flow (UBL or CII XML,
  or PDF/A-3). This is the "flux" deposit used for an already-formatted
  invoice, as opposed to `/deposer/soumettre` which lets Chorus Pro compose
  the invoice from discrete JSON fields. This adapter always sends a
  complete UBL document, so it always uses `/deposer/flux`.
  Request body (JSON):
  ```json
  {
    "fichierFlux": "<base64 file content>",
    "nomFichier": "<filename>",
    "syntaxeFlux": "IN_DP_E2_UBL_INVOICE",
    "avecSignature": false
  }
  ```
  Response body on success:
  ```json
  { "numeroFluxDepot": "CPP0021100000000000000023" }
  ```
  `numeroFluxDepot` is the flow deposit number and becomes this adapter's
  `providerMessageId`. On rejection the API returns a non-2xx status with a
  Chorus Pro error body (`code` + `message` fields, exact shape versioned
  with the API — this adapter reads whatever `message`/`libelle` field is
  present and surfaces it verbatim as `errorText`, never inventing one).
  Sources: [Communauté Chorus Pro — Submit flow
  invoice](https://communaute.chorus-pro.gouv.fr/submit-flow-invoice/?lang=en),
  [Documentation Chorus Pro — Déposer et suivre sa facture avec les services
  API
  G2B](https://portail.chorus-pro.gouv.fr/aife_documentation?id=kb_article_view&sysparm_article=KB0013510).
- `GET /consulter/historique` (or the flow-status lookup documented alongside
  it) — used by `checkStatus` to read the lifecycle of a deposited flow
  and/or the invoice(s) it produced. Chorus Pro invoice lifecycle statuses
  include (non-exhaustive, per the same documentation set): `DEPOSEE`,
  `A_RECYCLER` / `REJETEE` (rejected — malformed or recipient not found in
  the annuaire), `MISE_A_DISPOSITION`, `RECUPEREE`, `A_TRAITER`, `MANDATEE`,
  `COMPTABILISEE`, `MISE_EN_PAIEMENT`, `SERVICE_FAIT`. This adapter maps them
  to the shared `pending | accepted | rejected` contract: any explicit
  rejection code maps to `rejected`; anything indicating the invoice reached
  or passed the recipient's processing chain maps to `accepted`; every
  earlier in-flight state maps to `pending`.
- The syntax code for UBL invoices is `IN_DP_E2_UBL_INVOICE` per the current
  Chorus Pro "syntaxeFlux" nomenclature (earlier documentation and some
  third-party integrations reference `IN_DP_E1_UBL_INVOICE` for an older
  revision of the same UBL profile — the exact current code is confirmed at
  onboarding time from the PISTE-hosted OpenAPI spec / Swagger for
  `cpro/factures`, not guessed here).

Recipient identification is by **SIRET** (14-digit): the invoice's
`AccountingCustomerParty` carries the public entity's SIRET, and Chorus Pro
resolves routing (service exécutant, engagement/`numeroEngagement` when the
buyer requires one) from its own `annuaire` (directory) using that SIRET —
this adapter does not send `codeServiceExecutant` / `numeroEngagement`
separately; when the buyer's public-entity directory entry requires one and
none is present, Chorus Pro returns a documented rejection, which is
surfaced verbatim rather than guessed at client-side.

## 4. The 2026 B2B reform — PPF is a directory, not a transmission channel

The state-run PPF (Portail Public de Facturation) was **not** built out into
a universal invoice-transmission portal. As of the current DGFiP position,
the state abandoned that plan and the PPF's role is limited to:

- the central **directory** (annuaire) mapping every SIRET to the platform
  it receives e-invoices through, and
- the **e-reporting concentrator** for the transaction/payment data that
  must reach the tax administration regardless of which platform carried
  the invoice.

All B2B invoice transmission itself goes through an accredited **PDP**
(Plateforme de Dématérialisation Partenaire), renamed **PA** (Plateforme
Agréée) in the DGFiP's own more recent naming. A business cannot send or
receive a compliant B2B e-invoice without going through one.

- Official, authoritative list: published by DGFiP on impots.gouv.fr under
  *Professionnel > Gérer mon entreprise/association > Je passe à la
  facturation électronique > Je consulte la liste des plateformes agréées*
  (downloadable ODS/XLSX/PDF, refreshed periodically; some entries carry
  "immatriculation sous réserve" — interoperability tests still in progress
  — versus definitive registration). This is the only site to treat as
  authoritative; every other list is a secondary aggregation of it.
- As of the most recent count found in this research (September 2026), the
  DGFiP list carries on the order of 150 registered platforms.

This project has **no PDP integration** and none should be invented. See
§6 for a shortlist to hand to jojo.

## 5. What this adapter implements and what it deliberately does not

- Implements: Chorus Pro (B2G) send + status via PISTE OAuth2, for a French
  public-sector recipient.
- Does **not** implement: any PDP client for French B2B. When the recipient
  is not identifiable as a public body, `send()` throws
  `DomainError('EINVOICE_TRANSPORT_NOT_CONFIGURED', ...)` rather than
  silently routing through Chorus Pro (which would reject it anyway — Chorus
  Pro is B2G-only) or fabricating a PDP call.

## 6. PDP/PA shortlist (public API, established vendors) — for jojo to pick

None of these are wired up; this is only a shortlist from the public
approved-platform landscape for a future decision:

- **Esker** — established EDI/AP-AR vendor, accredited PA, published API for
  outbound/inbound e-invoicing.
- **Generix Group** — accredited PA, API + EDI + Peppol connectivity, covers
  Factur-X/UBL/CII.
- **Docaposte** (La Poste group) — accredited PA aimed at TPE/PME/ETI with a
  documented onboarding API.
- **B2Brouter** — API-first e-invoicing platform with an explicit
  developer-facing REST API for French compliance.
- Full, current, authoritative shortlist should always be cross-checked
  against the live DGFiP list above before a contract is signed — accreditor
  status changes (some listings are "sous réserve").

## Sources

- https://www.impots.gouv.fr/organismes-publics-la-facturation-electronique-avec-chorus-pro-0
- https://communaute.chorus-pro.gouv.fr/documentation/piste-presentation/?lang=en
- https://communaute.chorus-pro.gouv.fr/documentation/help-for-api-developers-in-oauth2-mode/?lang=en
- https://communaute.chorus-pro.gouv.fr/documentation/connection-to-chorus-pro/?lang=en
- https://communaute.chorus-pro.gouv.fr/submit-flow-invoice/?lang=en
- https://portail.chorus-pro.gouv.fr/aife_documentation?id=kb_article_view&sysparm_article=KB0013510
- https://portail.chorus-pro.gouv.fr/aife_documentation?id=kb_article_view&sysparm_article=KB0012174
- https://www.data.gouv.fr/dataservices/api-chorus-pro
- https://www.data.gouv.fr/datasets/plateformes-agreees-pa-ex-pdp-pour-la-facturation-electronique-liste-dgfip-enrichie-2026
