# KSeF integration notes

Source of truth: the Ministry of Finance's own API repository,
[CIRFMF/ksef-api](https://github.com/CIRFMF/ksef-api) (docs + the published
OpenAPI description), plus [ksef.podatki.gov.pl](https://ksef.podatki.gov.pl)
for rollout status. Everything below was read from those sources on
2026-09-11; the OpenAPI file served at that time (`open-api.json`) declares
`"title": "KSeF API TE"`, `"version": "2.7.1"` and the single documented
server `https://api-test.ksef.mf.gov.pl/v2`.

## Which API version

**KSeF API 2.0**, not 1.0. Open testing of 2.0 started 2025-09-30
([podatki.gov.pl](https://ksef.podatki.gov.pl/wyjasnienia/start-otwartych-testow-api-ksef-20/)),
a Demo (pre-production) environment followed
([podatki.gov.pl](https://ksef.podatki.gov.pl/wyjasnienia/ministerstwo-finansow-udostepnilo-srodowisko-przedprodukcyjne-demo-api-ksef-20/)),
and the mandatory-use rollout is staged from February 2026
([etapy wdrożenia](https://ksef.podatki.gov.pl/etapy-wdrozenia-ksef/)).
By the current date (2026-09-11) the production environment is live and 2.0
is what integrators are told to build against; 1.0 is not addressed by this
adapter.

## Environments

| Env | API base | Docs |
| --- | --- | --- |
| TEST | `https://api-test.ksef.mf.gov.pl/v2` | `https://api-test.ksef.mf.gov.pl/docs/v2/index.html` |
| DEMO | `https://api-demo.ksef.mf.gov.pl/v2` | `https://api-demo.ksef.mf.gov.pl/docs/v2/index.html` |
| PROD | `https://api.ksef.mf.gov.pl/v2` | `https://api.ksef.mf.gov.pl/docs/v2/index.html` |

The TEST base above is the exact `servers[0].url` from the published
`open-api.json`; DEMO and PROD follow the same `api-<env>.ksef.mf.gov.pl/v2`
pattern documented in
[`srodowiska.md`](https://github.com/CIRFMF/ksef-api/blob/main/srodowiska.md),
which describes TEST as accepting self-signed certs and **random/self-picked
NIPs** (data isn't isolated between integrators there), DEMO as a
production-config mirror for final validation, and PROD as the only
environment with legal effect.

## Authentication (`uwierzytelnianie.md`, confirmed against `open-api.json`)

KSeF-token auth is a four-call handshake, all under `/auth`:

1. **`POST /auth/challenge`** — empty body. Response
   (`AuthenticationChallengeResponse`): `{ challenge, timestamp, timestampMs, clientIp }`.
   `challenge` is a 36-char string; `timestampMs` is Unix-epoch milliseconds
   for the same instant. No auth required.

2. Build the encrypted-token string documented as `token|timestamp` in
   [`InitTokenAuthenticationRequest.encryptedToken`](https://github.com/CIRFMF/ksef-api/blob/main/open-api.json):
   `` `${KSEF_TOKEN}|${timestampMs}` `` (UTF-8), then RSA-encrypt it with the
   MF public key whose `usage` includes `KsefTokenEncryption` (fetched from
   `GET /security/public-key-certificates`, no auth — an array of
   `PublicKeyCertificate { certificate (base64 DER X.509), certificateId,
   publicKeyId, usage[], validFrom, validTo }`). Padding is **RSA-OAEP,
   SHA-256 hash, MGF1-SHA256** — spelled out identically for both the token
   key and the session's symmetric key in `EncryptionInfo`'s schema
   description ("Padding: OAEP z SHA-256"). Base64-encode the ciphertext.

3. **`POST /auth/ksef-token`** — body (`InitTokenAuthenticationRequest`):
   `{ challenge, contextIdentifier: { type: "Nip", value: <10-digit NIP> },
   encryptedToken }`. `type` is one of `Nip | InternalId | NipVatUe |
   PeppolId`; a self-employed/company sender authenticating as itself uses
   `Nip`. Response `202` (`AuthenticationInitResponse`):
   `{ referenceNumber, authenticationToken: { token, validUntil } }`. This
   `authenticationToken` is short-lived and only good for the next two calls.

4. **`GET /auth/{referenceNumber}`** — `Authorization: Bearer
   <authenticationToken.token>`. Response (`AuthenticationOperationStatusResponse`)
   carries `status: { code, description, details[] }`. The status table from
   the schema:

   | Code | Meaning |
   | --- | --- |
   | 100 | authenticating |
   | 200 | success |
   | 415 | failed — no permissions |
   | 425 | invalidated by the user |
   | 450 | failed — bad token/challenge/encryption/encoding/context |
   | 460 | failed — internal error |

   Poll until the code leaves 100.

5. **`POST /auth/token/redeem`** — same bearer as step 4, empty body.
   Response (`AuthenticationTokensResponse`): `{ accessToken: { token,
   validUntil }, refreshToken: { token, validUntil } }`. This call is
   one-shot — repeating it with the same `authenticationToken` is documented
   to 400. `accessToken` is what authorizes every `/sessions/*` call below;
   `refreshToken` (valid up to 7 days) can be exchanged via **`POST
   /auth/token/refresh`** (`Authorization: Bearer <refreshToken>`) for a new
   `accessToken` without repeating steps 1–4.

An XAdES-signature auth path also exists (`POST /auth/xades-signature`) for
qualified-certificate holders; out of scope here since jojo's setup is a
plain KSeF token.

## Sending an invoice — interactive session (`sesja-interaktywna.md` +
`faktury/sesje/sesja-sprawdzenie-stanu-i-pobranie-upo.md`, field names taken
verbatim from `open-api.json`)

1. **`POST /sessions/online`** (Bearer = accessToken). Body
   (`OpenOnlineSessionRequest`):
   ```json
   {
     "formCode": { "systemCode": "FA", "schemaVersion": "1-0E", "value": "FA" },
     "encryption": {
       "encryptedSymmetricKey": "<base64 RSA-OAEP-SHA256 of a fresh 32-byte AES key, MF cert usage SymmetricKeyEncryption>",
       "initializationVector": "<base64 of a fresh 16-byte IV>"
     }
   }
   ```
   `formCode` values are enumerated in the schema's own table; FA(3) is
   `systemCode: "FA"`, `schemaVersion: "1-0E"` — the same triple that also
   maps to FA(2), since the version lives in the XML itself
   (`p:KodFormularza kodSystemowy="FA (3)" wersjaSchemy="1-0E"`, produced by
   `fa3-mapper.ts`), not in this envelope. Response `201`
   (`OpenOnlineSessionResponse`): `{ referenceNumber, validUntil }`
   (`validUntil` — a session auto-closes 12h after opening if untouched).

2. **`POST /sessions/online/{referenceNumber}/invoices`** (same Bearer).
   Encrypt the FA(3) XML with **AES-256-CBC, PKCS#7 padding**, the session's
   key and IV (`SendInvoiceRequest.encryptedInvoiceContent`'s own
   description names the algorithm explicitly). Body:
   ```json
   {
     "invoiceHash": "<base64 SHA-256 of the plaintext XML bytes>",
     "invoiceSize": <plaintext byte length>,
     "encryptedInvoiceHash": "<base64 SHA-256 of the ciphertext>",
     "encryptedInvoiceSize": <ciphertext byte length>,
     "encryptedInvoiceContent": "<base64 ciphertext>"
   }
   ```
   Response `202` (`SendInvoiceResponse`): `{ referenceNumber }` — this is
   the **invoice reference number**, KSeF's own tracking id for this
   submission (not yet a KSeF number — that only exists once the invoice is
   accepted).

3. **`POST /sessions/online/{referenceNumber}/close`** — empty body, `204`.
   Required to trigger the session's aggregate UPO generation
   (`SessionStatusResponse.upo`); per-invoice status/UPO below don't need the
   session to stay open, but closing is part of the documented lifecycle and
   is what this adapter does right after a successful send.

## Status polling and UPO

- **`GET /sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}`** →
  `SessionInvoiceStatusResponse`: `{ ordinalNumber, invoiceNumber, ksefNumber,
  referenceNumber, invoiceHash, invoicingDate, acquisitionDate,
  permanentStorageDate, upoDownloadUrl, upoDownloadUrlExpirationDate,
  invoicingMode, status: { code, description, details[] } }`. The status
  table, quoted verbatim from the schema:

  | Code | Meaning |
  | --- | --- |
  | 100 | accepted for further processing |
  | 150 | processing |
  | 200 | success — `ksefNumber` and (once generated) `upoDownloadUrl` are populated |
  | 405 | cancelled — session-level error |
  | 410 | invalid permission scope |
  | 415 | can't send an invoice with an attachment |
  | 430 | invoice file verification error |
  | 435 | decryption error |
  | 440 | duplicate invoice (`details` carry `originalSessionReferenceNumber`/`originalKsefNumber`) |
  | 450 | document semantics verification error |
  | 500 | unknown error |
  | 550 | cancelled by the system — retry |

  100/150 → `pending`; 200 → `accepted`; everything else → `rejected`, with
  `errorText` built from `description` + `details`.

  `ksefNumber` matches KSeF's own regex
  (`^([1-9](\d[1-9]|[1-9]\d)\d{7})-(20[2-9]\d|2[1-9]\d{2}|[3-9]\d{3})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-([0-9A-F]{6})-?([0-9A-F]{6})-([0-9A-F]{2})$`),
  which the schema notes is 35 chars in 2.0 (36 accepted for 1.0
  back-compat).

- **UPO** (Urzędowe Poświadczenie Odbioru — the official proof of receipt,
  an XAdES-signed XML the Ministry countersigns): once `status.code === 200`,
  `upoDownloadUrl` is a pre-authorized link (`GET`, **no bearer**, expires at
  `upoDownloadUrlExpirationDate`) straight to the UPO document; there's also
  a stable, always-bearer-authorized path,
  `GET /sessions/{referenceNumber}/invoices/{invoiceReferenceNumber}/upo`
  (`200 application/xml`, raw XML body). This adapter records the KSeF
  number and this UPO reference in `checkStatus`'s `receipt`; it does not
  fabricate or guess UPO content, and downloads the XML lazily rather than
  assuming a URL that hasn't been generated yet.

## Errors

Any non-2xx from KSeF is surfaced with its real body
(`ExceptionResponse.exception`: `{ exceptionDetailList: [{ exceptionCode,
exceptionDescription, details[] }], referenceNumber, serviceCode, serviceCtx,
serviceName, timestamp }`, or a plain RFC-7807 `application/problem+json` for
`400`/`401`/`403`/`429`) — this adapter throws with that body rather than
inventing a synthetic rejection.

## What jojo needs to do

See the "Poland (KSeF)" section of `DEPLOY.md`.
