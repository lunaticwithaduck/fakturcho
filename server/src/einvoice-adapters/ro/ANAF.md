# ANAF e-Factura (RO SPV) — API facts

Sources (official, Sept 2026):

- Web service reference: "Prezentare servicii web pentru Sistemul national
  privind factura electronica RO e-Factura",
  https://mfinante.gov.ro/static/10/eFactura/prezentare%20api%20efactura.pdf,
  linked from https://mfinante.gov.ro/ro/web/efactura/informatii-tehnice
- OAuth2 registration and token guide: "Procedura de inregistrare a
  aplicatiilor in portalul ANAF",
  https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf
- Response field names for `upload`/`stareMesaj` (ANAF's PDF gives request
  shapes but not response attribute names) cross-checked against the
  open-source client `github.com/printesoi/e-factura-go`
  (`pkg/efactura/rest.go`), which mirrors the ANAF Java/Swagger DTOs.

## Base URLs

| Environment | Base |
| --- | --- |
| test | `https://api.anaf.ro/test/FCTEL/rest` |
| prod | `https://api.anaf.ro/prod/FCTEL/rest` |

## OAuth2

Two-server model: `logincert.anaf.ro` is the identity provider, `api.anaf.ro`
is the protected resource.

- Authorization endpoint: `https://logincert.anaf.ro/anaf-oauth2/v1/authorize`
- Token endpoint: `https://logincert.anaf.ro/anaf-oauth2/v1/token`
- App registration (client id/secret) happens once, by hand, at
  `https://www.anaf.ro/InregOauth` → "Editare profil Oauth" → service
  `E-Factura`, requires signing in with a qualified digital certificate that
  carries an SPV PJ role (legal representative / delegate / proxy).
- The one-time authorization-code exchange (to mint the first refresh token)
  also requires that same certificate in the browser — this cannot be
  automated from the server and is the one step jojo must do by hand (see
  `DEPLOY.md`).
- Client authentication on the token endpoint is HTTP Basic
  (`Authorization: Basic base64(client_id:client_secret)`), confirmed by the
  registration guide ("Client Authentication: Send as Basic Auth header").
- Refresh request: `POST /anaf-oauth2/v1/token`, Basic auth header, body
  `application/x-www-form-urlencoded` with `grant_type=refresh_token` and
  `refresh_token=<value>`. Response `200 OK`, JSON body
  `{ access_token, token_type, refresh_token, expires_in }` (standard
  RFC 6749 §5.1 shape; ANAF's guide: "În Body se găsesc valorile noi pentru
  access_token și refresh_token").
- Lifetimes: access token (JWT) 129600 minutes = 90 days; refresh token
  525600 minutes = 365 days. Both are reusable until they expire.
- `429 Too Many Requests` above 1000 calls/minute against `api.anaf.ro`.

## `upload` — submit an invoice

```
POST {base}/upload?standard=UBL&cif={cif}
Authorization: Bearer {access_token}
Content-Type: text/plain
Body: <the UBL/CIUS-RO XML>
```

- `standard=UBL` for a normal invoice (`CN` = credit note, `CII`, `RASP` are
  the other accepted values).
- `cif` is the numeric CIF of the party the SPV should notify if the seller
  can't be identified from the XML — the issuer must hold SPV rights for it.
- Response is XML, one `header` element in namespace
  `mfp:anaf:dgti:spv:respUploadFisier:v1`:
  - success: `<header dateResponse="…" ExecutionStatus="0" index_incarcare="5001"/>`
  - rejected: `<header dateResponse="…" ExecutionStatus="1"><Errors errorMessage="…"/></header>`
    (one or more `Errors` children)
  - `ExecutionStatus="0"` is the only success value; `index_incarcare` is the
    upload index used by every later call.

## `stareMesaj` — poll the outcome

```
GET {base}/stareMesaj?id_incarcare={uploadIndex}
Authorization: Bearer {access_token}
```

Response is XML, `header` in namespace
`mfp:anaf:dgti:efactura:stareMesajFactura:v1`, attribute `stare`:

- `in prelucrare` — still processing, no other attributes.
- `ok` — validated; carries `id_descarcare` (the id for `descarcare`). The
  invoice is now visible to the buyer too.
- `nok` — rejected by the SPV; carries `<Errors errorMessage="…"/>` children.
- `XML cu erori nepreluat de sistem` — the upload itself was malformed
  (normally caught synchronously by `upload`, listed here for completeness).

## `descarcare` — fetch the signed response

```
GET {base}/descarcare?id={id_descarcare}
Authorization: Bearer {access_token}
```

Returns a zip (two XML files: the original invoice or the error list, and the
Ministry of Finance's XML signature over it) when the id is valid, or a JSON
error body otherwise.

## `listaMesajeFactura` (not used by this adapter)

`GET {base}/listaMesajeFactura?zile={1..60}&cif={cif}&filtru={E|T|P|R}` lists
downloadable responses independently of a specific upload — useful for
reconciling received invoices, out of scope for sending.

## What this adapter does and doesn't do

- `AnafTransport.send` uploads CIUS-RO UBL under the issuer's CUI (digits
  only — `RO` prefix stripped via `extractRomanianCui`), maps
  `ExecutionStatus 0` → `sent`, anything else → `rejected` with the ANAF
  `errorMessage`(s) joined.
- `AnafTransport.checkStatus` maps `in prelucrare` → `pending`, `ok` →
  `accepted` (also calling `descarcare` to confirm the signed receipt is
  retrievable, storing `id_descarcare` as `receipt`), everything else →
  `rejected` with the ANAF error text or the raw `stare` value.
- Every non-2xx response and every network failure is thrown as a real
  `Error` carrying ANAF's own status/body — nothing is ever synthesized as a
  success or given a fabricated message id.
- A `401` triggers exactly one token refresh + retry (access tokens are
  cached in memory for their `expires_in`, refreshed early by 5s of margin).
