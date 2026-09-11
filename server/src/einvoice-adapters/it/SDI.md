# SDI transmission (SDICoop) — facts and sources

Italy has no PEPPOL path for FatturaPA: every invoice, domestic B2B/B2C or
cross-border, is sent through the Sistema di Interscambio (SdI), run by the
Agenzia delle Entrate under mandate from MEF (art.1 comma 211, legge 244/2007).
There is no private intermediary channel that bypasses SdI — an
"intermediario" is just another accredited transmitter acting on someone
else's behalf, still talking the same SDICoop protocol below. Direct SDICoop
accreditation (or PEC, or the web/app upload, which do not fit a server
integration) is the only official transmission channel, so that is what is
implemented here.

## Primary sources

1. **"Specifiche delle regole tecniche di cui all'Allegato B del DM 55 del 3
   aprile 2013 per la trasmissione delle fatture elettroniche tramite Sistema
   di Interscambio" v1.8.1, 01/10/2020** (Agenzia delle Entrate / SOGEI, the
   base technical regulation) —
   https://www.fatturapa.gov.it/export/documenti/Specifiche_tecniche_SdI_v1.8.1.pdf
2. **"Istruzioni per il servizio SDICoop - Trasmissione" v3.2** (operational
   guide for the transmission-side web services) —
   https://www.fatturapa.gov.it/export/documenti/ws/trasmissione/v3.x/Istruzioni-per-il-servizio-SDICoop-Trasmissione-versione3.2.pdf
3. **`SdIRiceviFile_v1.0.wsdl` / `TrasmissioneTypes_v1.0.xsd`**, the WSDL/XSD
   pair referenced by both documents above, mirrored in AgID/Italia's public
   `fatturapa-testsdi` reference implementation —
   https://github.com/italia/fatturapa-testsdi/tree/master/soap/SdIRiceviFile

## The `SdIRiceviFile` web service (`RiceviFile` operation)

- Exposed by SdI itself. Single operation `RiceviFile`. WSDL:
  `SdIRiceviFile_v1.0.wsdl`, SOAP action
  `http://www.fatturapa.it/SdIRiceviFile/RiceviFile`, document/literal style.
  [source 3]
- Request element `fileSdIAccoglienza` (type `fileSdIBase_Type`):
  - `NomeFile` (`nomeFile_Type`, pattern `[a-zA-Z0-9_\.]{9,50}`)
  - `File` (`xsd:base64Binary`) — the FatturaPA XML (or a `.zip` of them),
    base64-encoded.
- Response element `rispostaSdIRiceviFile` (type
  `rispostaSdIRiceviFile_Type`):
  - `IdentificativoSdI` (`xsd:integer`, 12 digits) — SdI's own tracking id for
    the submission.
  - `DataOraRicezione` (`xsd:dateTime`).
  - `Errore` (optional, `erroreInvio_Type`) — one of:
    - `EI01` = *file allegato vuoto* (empty attached file)
    - `EI02` = *servizio momentaneamente non disponibile* (service
      temporarily unavailable)
    - `EI03` = *utente non abilitato* (user/certificate not enabled)
  [source 3 XSD annotations; wording confirmed in source 2 §1.3.1]

When `Errore` is present the submission is rejected; `IdentificativoSdI` is
still returned but is not a successful send.

## Endpoints

- Production: `https://servizi.fatturapa.it/ricevi_file`
- Test: `https://testservizi.fatturapa.it/ricevi_file`

The address in the published WSDL is the production one
(`http://servizi.fatturapa.it/ricevi_file` — SdI serves it over HTTPS in
practice); the test host is the same path on `testservizi.fatturapa.it`. Both
require an accredited client certificate — **the test environment is not open
to the public, it exists only for parties who have completed accreditation**
and been issued test credentials; there is no anonymous sandbox. [source 2 §4
+ community confirmation, e.g. the SDICoop accreditation threads on
forum.italia.it]

## Filename convention

Source 1 §2.2 ("Nomenclatura dei file da trasmettere"), verbatim structure:

```
<codice paese><identificativo univoco del trasmittente>_<progressivo>.xml
```

- `codice paese`: ISO 3166-1 alpha-2 (`IT` for an Italian sender).
- Transmitter id: the sender's fiscal identifier — codice fiscale/partita IVA
  for an Italian sender (11–16 chars), or the home country's own identifier
  for a foreign sender (2–28 chars).
- Separator: `_` (ASCII 95).
- `progressivo`: up to 5 alphanumeric characters `[a-zA-Z0-9]`, only needs to
  be unique per file sent by that transmitter — not required to be strictly
  sequential.
- Extension `.xml` (XAdES-BES enveloped signature) or `.xml.p7m` (CAdES-BES
  detached signature); `.zip` for a batch.
- Official example: `ITAAABBB99T99X999W_00001.xml`.

Combined with the XSD's `[a-zA-Z0-9_\.]{9,50}` length/charset bound, this is
what `buildFileName` in `sdi-transport.ts` implements.

## Transport, auth, accreditation

- Transport: HTTPS over TLS 1.2, SOAP with attachments (MTOM), described by
  WSDL; **authentication and authorization are certificate-based** — a
  mutual-TLS client certificate identifies the calling system. [source 1
  §3.1.2, verbatim: "protocollo HTTPS come trasporto su canale cifrato TLS
  1.2", "autenticazione e autorizzazione basata sull'utilizzo di certificati"]
- To obtain the certificate: subscribe to the "accordo di servizio" through
  the accreditation procedure on www.fatturapa.gov.it, after which SdI runs
  interoperability ("qualificazione") tests against the calling system and
  then issues the electronic certificate used for future calls. [source 1
  §3.1.2] The callback endpoints SdI uses to reach the sender back
  (`TrasmissioneFatture`, see below) are declared during that same
  accreditation request and can be changed later from the "Gestire il Canale"
  function on the same site. [source 2 §1.2]

## Outcomes arrive by callback, not by polling

`RiceviFile`'s response only ever tells you SdI accepted or rejected the
*file*, immediately. What happens to the invoice afterwards (delivered,
rejected by SdI's own controls, rejected by the recipient, undeliverable,
etc.) is pushed by SdI, asynchronously, to a second web service that the
**transmitter itself exposes** at the endpoints declared during
accreditation. Source 2 §1.4 names it `TrasmissioneFatture`, with one
operation per notification type:

| Op (WSDL) | Short name | Meaning |
| --- | --- | --- |
| `RicevutaConsegna` | RC | delivery receipt — SdI delivered the invoice to the recipient's channel |
| `NotificaScarto` | NS | SdI rejected the file outright (validation failure) |
| `NotificaMancataConsegna` | MC | SdI could not deliver to the recipient |
| `NotificaEsito` | NE | the recipient accepted/rejected the invoice (PA only) |
| `NotificaDecorrenzaTermini` | DT | 15 days elapsed with no `NotificaEsito` (PA only) |
| `AttestazioneTrasmissioneFattura` | AT | 10 days after an MC with still no delivery — attests the transmission failed for good |

There is no `SdIRiceviFile`-side query/poll operation to pull status by
`IdentificativoSdI` — the protocol is push-only. That is why `SdiTransport`
does not implement `checkStatus`: doing so honestly requires running the
`TrasmissioneFatture` receiver service and reading its callbacks, which is a
routing/infrastructure change (a new inbound endpoint, its own TLS
certificate, wiring into the shared transport/status pipeline) outside this
adapter's directory and outside this task's scope. **Building the callback
receiver and feeding RC/NS/MC/NE/DT/AT into document status is the explicit
follow-up.** Until it exists, an invoice's SdI outcome is genuinely unknown
after the initial accept — that is a real gap in accreditation-based SdI
integration, not a shortcut taken here.
