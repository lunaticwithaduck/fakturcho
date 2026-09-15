# AEAT Verifactu + FACe — technical facts and sources

Everything below was checked against the primary source (AEAT's or FACe's own
servers/documents), not a summary of them. Where a document is undated it carries the
version number printed on it.

## 1. Verifactu (AEAT)

### 1.1 What "Verifactu" is

Real Decreto 1007/2023 (5 Dec 2023) requires invoicing software to either (a) generate
a signed local record for every invoice ("SIF no verificable"), reportable only on
request, or (b) submit each invoice's record to AEAT at the moment of issuance
("VERI*FACTU"), in which case AEAT itself vouches for the record and no local signature
is required. This adapter implements only the VERI*FACTU path: `VerifactuTransport`
submits a `RegistroAlta` for every invoice via the `RegFactuSistemaFacturacion` SOAP
operation.

Source: `sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html`

### 1.2 WSDL and endpoints

The WSDL is served directly by AEAT at
`https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SistemaFacturacion.wsdl`
(fetched and diffed byte-for-byte against the copy this adapter was built from — see
`server/src/einvoice-adapters/es/verifactu-envelope.ts` for the namespaces it declares).
It defines two services:

- `sfVerifactu` — systems on the VERI*FACTU path. Ports:
  - production: `https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP`
  - production (sello/company-seal certificate): `https://www10.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP`
  - pruebas (test): `https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP`
  - pruebas (sello): `https://prewww10.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP`
- `sfRequerimiento` — systems remitting only on request ("no verificable"), not used here.

Two operations exist on the `sfVerifactu` port: `RegFactuSistemaFacturacion` (submit
`RegistroAlta`/`RegistroAnulacion`) and `ConsultaFactuSistemaFacturacion` (query a
previously-submitted record). Both are SOAP 1.1, `style="document"`, `use="literal"`.

`VerifactuTransport` uses the non-sello production/pruebas ports (`www1`/`prewww1`);
the `www10`/`prewww10` sello ports are for a different certificate type
(company seal rather than representative/qualified certificate) and are not wired up.

Source: the WSDL above; `sede.agenciatributaria.gob.es/.../informacion-tecnica/wsdl-servicios-web.html`.

### 1.3 Authentication

"Las aplicaciones que envían información a los servicios web deberán autenticarse con
certificado electrónico cualificado reconocido" — a qualified electronic certificate
(FNMT, or a representative/company-seal certificate accepted by AEAT), presented as a
**TLS client certificate** (mutual TLS), not a WS-Security XML signature. `RegistroAlta`
does carry an *optional* `ds:Signature` element in its schema, but it is not required
for the VERI*FACTU real-time submission path (only for the "no verificable" path where
the record is generated and kept locally without immediate submission) — so this
adapter authenticates purely at the TLS layer via `AEAT_CLIENT_CERT_PEM`/`AEAT_CLIENT_KEY_PEM`.

Source: `Veri-Factu_Descripcion_SWeb.pdf` (Sistemas Informáticos de Facturación, v1.0.3), §4.1/4.3.

### 1.4 RegistroAlta — schema, fields, defaults this adapter assumes

Schema files: `SuministroLR.xsd` (`RegFactuSistemaFacturacion` envelope, `RegistroFacturaType`),
`SuministroInformacion.xsd` (`RegistroFacturacionAltaType`, `RegistroFacturacionAnulacionType`,
and every shared type). Both fetched from the AEAT static file server (same base path as
the WSDL above) and matched against the `hectorsipe/aeat-verifactu` GitHub mirror
(differences were whitespace-only).

`verifactu-mapper.ts` (split into `verifactu-desglose.ts`, `verifactu-destinatario.ts`,
`verifactu-sistema-informatico.ts`) builds a `RegistroAlta` covering:

- `IDFactura` (`IDEmisorFactura`/`NumSerieFactura`/`FechaExpedicionFactura`, the latter
  `dd-mm-yyyy` per the `fecha` simple type — **not** ISO 8601).
- `TipoFactura`: `F1` (factura completa, `ClaveTipoFacturaType`) when the recipient has
  a usable tax id, `F2` (sin identificación del destinatario) otherwise, `R1` (factura
  rectificativa) for `credit_note`.
- `Desglose`/`DetalleDesglose` per VAT-rate group (reusing `computeVatSubtotals`), mapped
  from this repo's `VatCategory` (see `packages/shared-types/src/vat.ts`) to Verifactu's
  `CalificacionOperacion`/`OperacionExenta`:

  | VatCategory | Verifactu qualifier | Why |
  |---|---|---|
  | `S` (standard) | `CalificacionOperacion=S1` | sujeta y no exenta, sin inversión |
  | `Z` (zero-rated) | `CalificacionOperacion=S1`, `TipoImpositivo=0.00` | still *subject*, just at 0% — not an exemption |
  | `AE` (reverse charge) | `CalificacionOperacion=S2` | sujeta y no exenta, con inversión del sujeto pasivo |
  | `O` (outside scope) | `CalificacionOperacion=N1` | no sujeta art. 7/14/otros |
  | `E` (exempt) | `OperacionExenta=E1` | exenta art. 20 LIVA (general case) |
  | `G` (export outside EU) | `OperacionExenta=E2` | exenta art. 21 LIVA (exportaciones) |
  | `K` (intra-EU supply) | `OperacionExenta=E5` | exenta art. 25 LIVA (entregas intracomunitarias) |

  `Impuesto=01` (IVA) and `ClaveRegimen=01` (régimen general) are hardcoded — IGIC/IPSI
  and every special regime (recargo de equivalencia, agencias de viajes, oro de
  inversión, grupo de entidades…) are out of scope; a document needing one of those
  will still submit but under the general-regime code, which AEAT may reject.
  `CalificacionOperacion` values `E7`/`E8` (IGIC/IPSI-specific exemptions) are unused
  for the same reason.
  Source for the E1–E8 mapping: `docs.activaerp.com/es/documentacion/calificacion-verifactu/6294`
  (cross-checked against the `OperacionExentaType`/`CalificacionOperacionType`
  enumerations in `SuministroInformacion.xsd`, which list the codes but not their
  article numbers).
- `Encadenamiento`: `PrimerRegistro=S` for the first record for an issuer NIF, else
  `RegistroAnterior` carrying the previous record's `IDEmisorFactura`/`NumSerieFactura`/
  `FechaExpedicionFactura`/`Huella` — see §1.5.
- `SistemaInformatico`: identifies the *software*, not the issuer — `NombreRazon`/`NIF`
  of the software producer (env `AEAT_SOFTWARE_NAME`/`AEAT_SOFTWARE_NIF`, **not** the
  tenant's own NIF), `IdSistemaInformatico` (`AEAT_SOFTWARE_APP_ID`, default `01`),
  `NumeroInstalacion` set to the issuer's NIF (one "installation" per tenant),
  `TipoUsoPosibleSoloVerifactu=S` (this software only ever runs the VERI*FACTU path),
  `TipoUsoPosibleMultiOT=S` (it is used by more than one taxpayer across the fleet of
  tenants), `IndicadorMultiplesOT=N` (a given installation/tenant is single-obligor).
- `FechaHoraHusoGenRegistro`: ISO 8601 with the **Europe/Madrid** offset (`aeat-time.ts`
  computes it via `Intl.DateTimeFormat` regardless of the server's own timezone).
- `TipoHuella=01` (SHA-256, the only algorithm the spec currently permits) and `Huella`.

**Known gap**: `credit_note` submits as `R1` without `FacturasRectificadas` — the
`DocumentDto` snapshot carries only `originalDocumentId` (a DB id), not the original
document's own `IDFactura` (NIF/series/date), so the rectified-invoice reference cannot
be built from this file alone. AEAT will likely reject or flag such a record until the
original's snapshot is threaded through (a change to `documents/`, outside this adapter's
directory).

### 1.5 Huella (hash) — verified against AEAT's own worked examples

`aeat-huella.ts` implements the algorithm exactly as specified in
`Veri-Factu_especificaciones_huella_hash_registros.pdf` (v0.1.2, 27/08/2024):

1. Concatenate fixed-name fields as `campo1=valor1&campo2=valor2&…`, in a fixed order
   per record type (`RegistroAlta`: `IDEmisorFactura`, `NumSerieFactura`,
   `FechaExpedicionFactura`, `TipoFactura`, `CuotaTotal`, `ImporteTotal`, `Huella` [of
   the *previous* record, empty string if first], `FechaHoraHusoGenRegistro`;
   `RegistroAnulacion` drops `TipoFactura`/`CuotaTotal`/`ImporteTotal`). A missing field
   still emits `campo=` with nothing after the `=`.
2. Encode the resulting string as UTF-8 bytes.
3. SHA-256, output as **64 uppercase hex characters**.

`aeat-huella.spec.ts` asserts the exact input string and exact hash for all three
worked examples in the PDF (§6: first record, chained second record, cancellation of
the second record) byte-for-byte — this is not a synthetic test, it reproduces AEAT's
own published input/output pairs.

The previous-record link is persisted per issuer NIF in the `EsVerifactuChainLink`
Prisma model (migration `20260911172912_es_verifactu_chain_link`) and only advanced
after AEAT accepts a record (`EstadoRegistro` `Correcto`/`AceptadoConErrores`) — a
record AEAT rejects (`Incorrecto`) never enters the stored chain, so a retry after
fixing the underlying problem recomputes the *same* record (same previous link, same
Huella) rather than skipping ahead.

### 1.6 QR code

`https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=…&numserie=…&fecha=DD-MM-AAAA&importe=…`
(production) / `https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?…` (pruebas), 4
mandatory params, `fecha` as `DD-MM-AAAA`, `importe` with a `.` decimal separator.
`ValidarQRNoVerifactu` is the equivalent for the non-VERI*FACTU path (not used here).

Source: `DetalleEspecificacTecnCodigoQRfactura.pdf` (v0.5.0), §5–6. Not yet wired into
the mapper/transport — AEAT does not require the QR in the SOAP submission itself, only
on the printed/PDF invoice, which is outside this adapter's scope (rendering lives in
`server/src/render/`).

### 1.7 Response and error handling

`RespuestaSuministro.xsd`: a submission's overall result is `EstadoEnvio`
(`Correcto`/`ParcialmenteCorrecto`/`Incorrecto`); each `RespuestaLinea` carries its own
`EstadoRegistro` (`Correcto`/`AceptadoConErrores`/`Incorrecto`), an optional
`CodigoErrorRegistro` (integer) and `DescripcionErrorRegistro`. A `CSV` (código seguro
de verificación) is only present when at least one record was accepted — `VerifactuTransport`
never fabricates one; a fully-rejected submission returns `status: 'rejected'` with the
real `CodigoErrorRegistro`/`DescripcionErrorRegistro`. A structural failure (bad XML,
untrusted certificate, etc.) comes back as a SOAP 1.1 `Fault`, handled the same way.

`ConsultaFactuSistemaFacturacion`'s response (`RespuestaConsultaLR.xsd`) uses a
differently-cased state enum for the same idea: `Correcta`/`AceptadaConErrores`/`Anulada`
(`EstadoRegistroSFType`). `VerifactuTransport.checkStatus` encodes the CSV plus the
invoice's own identity into `providerMessageId` (`csv|nif|numSerie|fecha`) because the
consulta operation has no "look up by CSV" — it queries by NIF + `PeriodoImputacion`
(fiscal year/month) + series + date, per `ConsultaLR.xsd`.

## 2. FACe

### 2.1 What FACe is

FACe ("Punto General de Entrada de Facturas Electrónicas") is Spain's mandatory portal
for B2G invoicing (Ley 25/2013). A supplier's software submits a Facturae XML (this
adapter reuses the existing `toFacturaeXml` mapper) through FACe's SOAP web service;
FACe routes it to the recipient public body using DIR3 codes carried **inside the
Facturae XML itself** (`AdministrativeCentres`), not as separate SOAP parameters.

### 2.2 WSDL and endpoints

Fetched live and used directly (both return byte-identical structures):

- production: `https://webservice.face.gob.es/facturasspp2?wsdl`
- pruebas: `https://se-face-webservice.redsara.es/facturasspp2?wsdl`

Binding style is **`rpc`/`encoded`** (`encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"`),
not document/literal — `face-envelope.ts` builds the RPC-shaped body accordingly
(`xsi:type` attributes on every leaf, matching SOAP encoding §5). Operations used:
`enviarFactura(EnviarFacturaRequest)` → `EnviarFacturaResponse` (`resultado` +
`factura.numeroRegistro`), and `consultarFactura(numeroRegistro)` → `ConsultarFacturaResponse`
(`resultado` + `factura.tramitacion`/`factura.anulacion`, each an `EstadoFactura`).
`anularFactura`, `consultarEstados`, `consultarUnidades*`, `consultarNIFs*`,
`consultarAdministraciones*` and `consultarListadoFacturas` exist on the same WSDL but
are not implemented (no product requirement to cancel a submitted invoice or browse the
DIR3 directory from inside fakturcho yet).

### 2.3 DIR3 codes and routing

A public-body invoice must carry three DIR3 codes (each a 9-character code: one
org-type letter + 8 alphanumerics, e.g. `L01280796`) identifying the órgano gestor
(receiving body), unidad tramitadora (processing/paying unit) and oficina contable
(accounting office) — `RoleTypeCode` `02`/`03`/`01` respectively inside Facturae's
`BuyerParty/AdministrativeCentres/AdministrativeCentre`.

Source: `datos.gob.es` DIR3/FACe dataset (real example code `L01280796`);
`descemp.com/recursos/ejemplos/facturae-v3-2-ejemplo-dir3` for the exact XML placement;
cross-checked against the FACe WSDL's own `UnidadDir3`/`OGUTOC` types (organoGestor/
unidadTramitadora/oficinaContable) used by its directory-lookup operations.

`RecipientSnapshotDto`/`EinvoiceTransportRecipient` have no DIR3 fields (they are
Italy/Peppol-shaped: `sdiRecipientCode`, `pec`, `peppolEndpointId`/`peppolScheme`), and
adding one is out of this file's scope (`packages/shared-types` is shared with every
other country's adapter). The signal used instead is the existing generic
`document.buyerReference`, formatted `DIR3:<organoGestor>:<unidadTramitadora>:<oficinaContable>`
(`face-dir3.ts`) — chosen specifically so an ordinary purchase-order reference (e.g.
`PEDIDO-2026-77`, the private-sector fixture's own value) is never mistaken for one.
`EsTransport.send` treats a document with a valid `DIR3:` buyerReference as a public
body: it always submits to Verifactu, and additionally to FACe. `facturae-parties.ts`
emits the matching `AdministrativeCentres` block whenever this signal is present.

### 2.4 Security — WS-Security 1.0 X.509 Token Profile

"Las peticiones deben ir firmadas… con un formato válido de WS-Security 1.0 X.509 Token
Profile. La validación de peticiones es delegada en la plataforma @firma, por lo que el
certificado utilizado para firmar debe ser reconocido por la misma" — every operation
(not just `enviarFactura`) must carry a signed SOAP header, verified by @firma against
a certificate FACe has been told to trust (via `contacta.face@seap.minhap.es`).

`face-wsse.ts` builds exactly the worked example FACe's own SARCF integration guide
publishes (`wsorganismos.pdf`, cap. 4 "Seguridad", p. 39–40): a `wsse:BinarySecurityToken`
(the signing cert's DER, base64, `ValueType=...X509v3`) in the SOAP header, and an
enveloped `ds:Signature` over the SOAP `Body` (`wsu:Id`-referenced, `exc-c14n`
canonicalization, `rsa-sha1`/`sha1` per the same worked example) whose `KeyInfo` points
back at the `BinarySecurityToken` via a `wsse:SecurityTokenReference`. Built with
`xml-crypto` (pinned `6.1.2`) — hand-rolling exclusive C14N correctly was judged not
feasible without a library, per the task's own allowance. `face-wsse.spec.ts` generates
a throwaway self-signed certificate with `openssl` and round-trips: sign → `xml-crypto`
verifies it valid → tamper the signed Body → verification fails → verify against a
different certificate → fails. `@xmldom/xmldom` and `xpath` (both already transitive
dependencies of `xml-crypto`) were added directly since this code parses/queries XML
with them for verification.

### 2.5 Responses and status codes

Every FACe operation's response wraps a `resultado` (`codigo`/`descripcion`/
`codigoSeguimiento`); `codigo="0"` is success (confirmed structurally by the WSDL's
`Resultado` type — no source publishes the full error-code catalogue publicly, so any
non-`"0"` code is treated as a real, undecoded rejection carrying AEAT's own
`descripcion`, never invented).

`consultarFactura`'s `tramitacion`/`anulacion` blocks use FACe's own published state
catalogue ("Resumen de los estados", `wsorganismos.pdf` Apéndice A):

| Estado | Código | Meaning |
|---|---|---|
| Registrada | 1200 | accepted |
| Registrada en RCF (+ Verificada/Recibida/Conformada) | 1300/1400/2100/2300 | accepted |
| Contabilizada la obligación de pago | 2400 | accepted |
| Pagada | 2500 | accepted |
| Rechazada | 2600 | **rejected** |
| Anulada | 3100 | **rejected** |
| No solicitada anulación | 4100 | (no cancellation in progress) |
| Solicitada anulación | 4200 | (cancellation pending — not surfaced separately) |
| Aceptada anulación | 4300 | **rejected** (the invoice itself is voided) |
| Rechazada anulación | 4400 | (cancellation request itself was refused; invoice unaffected) |

`FaceTransport.checkStatus` maps this table onto the transport interface's
`pending`/`accepted`/`rejected` — everything up to and including "Pagada" is `accepted`;
`2600`/`3100` (tramitación) or `4300` (anulación accepted) are `rejected`.

## 3. Known limitations (surfaced, not hidden)

- Credit notes submit to Verifactu as `R1` without `FacturasRectificadas` (§1.4).
- Only régimen general / IVA is modelled for `Desglose` (§1.4) — IGIC, IPSI and special
  regimes are not.
- `EsTransport.send` calls Verifactu and FACe independently and does not track
  per-leg completion: a retry after one leg failed and the other succeeded resubmits
  to **both** (FACe's own de-duplication behaviour on an identical resubmission was
  not verifiable from public documentation).
- FACe's full numeric error-code catalogue (`Resultado.codigo` for a failed `enviarFactura`)
  is not publicly published; non-zero codes are surfaced verbatim rather than decoded.
- `VerifactuTransport.checkStatus`'s `Cabecera` (`CabeceraConsultaSf`) is built from the
  documented `ObligadoEmision`/`PeriodoImputacion` shape but has not been exercised
  against a live sandbox response — `send()` (which returns a synchronous accept/reject
  in the same call) is Verifactu's primary path and was the priority.
