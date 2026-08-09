# Invoicing system — specification

A standalone web application through which a Bulgarian sole trader or small
company issues legally-formatted commercial documents. Each account represents
one legal issuer, with its own client list, product catalogue and document series.

Scope markers: **[MVP]** ships in phases 1–5. **[LATER]** is deferred and must
not be built early, but the data model must not preclude it.

---

## 1. Entities

### 1.1 Issuer profile [MVP]

One per account. The legal seller block reproduced on every document.

| Field | Bulgarian | Notes |
|---|---|---|
| `companyName` | Фирма | |
| `eik` | ЕИК / Булстат | unified identification code |
| `mol` | МОЛ | материално отговорно лице |
| `addressLine`, `city` | Адрес | rendered as one line |
| `phone` | Телефон | |
| `vatRegistered` | Регистрация по ЗДДС | drives the whole VAT branch |
| `vatNumber` | ДДС № | present only when registered |
| `bankName`, `iban`, `bic` | Банка, IBAN, BIC | held and printed in full |
| `altIban` | Алтернативна сметка | optional |

### 1.2 Client [MVP]

A reusable recipient. Only `companyName` is mandatory — a client may be a
private individual with no ЕИК.

`companyName · eik · vatNumber · address · email · mol`

Deduplicated by ЕИК within an account where one is present.

### 1.3 Product / service catalogue [MVP]

`name · defaultUnitPrice · unit`. Optional; prefills line items.

### 1.4 Document [MVP]

- **Identity** — `documentType`, `number`, `numberPrefix`, `numberSuffix`, `referenceNumber`
- **Dates** — `issuedAt`, `taxEventAt`, `dueAt`, `validUntil`
- **Money** — `subtotal`, `discountTotal`, `amount`, `vatIncluded`, `vatAmount`, `currency`
- **Content** — `lineItems[]`, `discounts[]`
- **Metadata** — `status`, `preparedBy`, `notes`, `emailText`, `originalDocumentId`
- **Party snapshots** — frozen `issuer*` and `recipient*` columns (§4)

### 1.5 Line item [MVP]

`name · quantity · unitPrice · lineTotal · sortOrder`. Column headers:
**Наименование · Количество · Цена · Общо**.

### 1.6 Discount [MVP]

`label`, and either `percent` (applied to subtotal) or a flat `amount`.

---

## 2. Document types [MVP]

| Type | Label | Tax document | Distinguishing rule |
|---|---|---|---|
| `invoice` | Фактура | yes | the standard case |
| `proforma` | Проформа фактура | no | pre-invoice; creates no tax obligation |
| `credit_note` | Кредитно известие | yes | references an original document |
| `debit_note` | Дебитно известие | yes | references an original document |
| `quote` | Ценова оферта | no | carries `validUntil`; no tax event date |

Tax documents carry **`(Оригинал)`** after the number; proforma and quote do not.
Title: `{TypeLabel} # {prefix}{number}{suffix}{marker}`.

Credit and debit notes are invalid without `originalDocumentId`.

---

## 3. Numbering [MVP]

- Independent series per `(account, documentType)`, unique on
  `(account, documentType, number)`.
- 10-digit zero-padded (`0000000016`). `prefix` and `suffix` are free text and
  are **not** part of the ordering key.
- The number is claimed **at issuance, not at creation**. Drafts carry none, so
  abandoned drafts leave no gaps. Bulgarian series must be gapless.
- The composer shows the previous and next number in the series. The next number
  is overridable so a business migrating from another system continues its
  existing sequence — but only while the series has no issued documents. Once
  a series has any, the sequence is fixed and an override is rejected with a
  domain error: a forward jump would create exactly the gap the series must
  not have.
- A collision is rejected with a domain error before it reaches the uniqueness
  constraint.
- Numbers are never reused or reassigned.

---

## 4. Party snapshots [MVP]

At issuance, the issuer profile and the recipient's details are copied onto the
document row. All subsequent rendering reads those frozen columns.

- Editing the issuer profile or a client never alters an issued document.
- A document issued while an optional field was blank stays blank.
- Issuance requires a complete issuer profile: `companyName`, `eik`,
  `addressLine`, `city` — plus `vatNumber` when `vatRegistered`. Without one,
  documents are saveable only as `draft`; issuing returns a domain error. No
  document ever issues with an empty seller block.
- The remaining profile fields (`mol`, `phone`, bank details) are optional at
  issuance and snapshot as blank when blank.

---

## 5. VAT (ЗДДС) [MVP]

Two mutually exclusive presentations.

**VAT charged** (20% standard rate) — base and tax shown separately:

```
Данъчна основа: 4 583,33 €
ДДС (20%):        916,67 €
```

**VAT not charged** — a legal ground is printed instead:

```
Основание за неначисляване на ДДС: чл.113, ал.9 от ЗДДС
```

- `чл.113, ал.9 от ЗДДС` is the default, covering an issuer not registered
  under ЗДДС.
- A VAT-registered issuer producing a 0%-VAT document selects from the statutory
  grounds: чл.21, чл.22, чл.28 + чл.86, чл.28c(E)(3) 77/388/EEC, чл.30 ал.1,
  чл.39 ал.1, чл.41, чл.47, чл.69 ал.2 + чл.21 ал.2, чл.84 + чл.17,
  чл.86 ал.1 ППЗДДС. The chosen text is stored verbatim and reproduced literally.
- The ground is selectable **only** in the VAT-registered-and-0% case. Every
  other account sees the ground that applies to it, non-editable. Enforced
  server-side.
- Proforma and quote print no exemption line.

---

## 6. Money and currency [MVP]

- Denominated in **EUR**, with **BGN alongside** on the amount due:
  `Сума за плащане: 5 500,00 € / 10 757,07 лв.`
- Conversion uses the fixed peg **1.95583**. Arithmetic, never a live FX lookup.
  Half-up rounding to two decimals.
- Bulgarian formatting throughout: comma decimal separator, space thousands
  separator — `1 600,00`, `10 757,07`.
- The total is rendered in words, in Bulgarian, uppercased:
  `ПЕТ ХИЛЯДИ И ПЕТСТОТИН EUR И 00 ЦЕНТА`.
- Dual BGN display is behind a config flag with an end date, not hardcoded —
  the transitional display obligation expires.

---

## 7. Dates [MVP]

`Дата на издаване` and `Данъчно събитие` are separate fields and routinely
differ; both appear on tax documents. Quotes show `Валидно до` in place of the
tax event. Format `DD.MM.YYYY` throughout.

---

## 8. Document rendering [MVP]

```
Получател:                          Дата на издаване: 02.08.2026
"Фирма" ООД                         Данъчно събитие:  02.08.2026
гр. София, ул. …                    [Статус: ПЛАТЕНО]
ЕИК: …
МОЛ: …

            Фактура # 0000000016 (Оригинал)

Наименование              Количество     Цена       Общо
…                                220     25,00   5 500,00

<amount in words>

                                        Общо: 5 500,00 €
                     Сума за плащане: 5 500,00 € / 10 757,07 лв.

Основание за неначисляване на ДДС: …

<issuer name>      <address>            <bank name>
ЕИК: …             Телефон: …           <IBAN>
МОЛ: …                                  BIC: …

Съставил: …                             Получател: …
```

A settled document carries a status marker (`Статус: ПЛАТЕНО`, `АНУЛИРАНА`) in
the header; a draft or merely-sent document carries none.

Properties that hold:

- **Exactly one renderer.** Viewing, printing and downloading resolve to the same
  generated artifact. In-app viewing is the generated PDF in a viewer. No
  separate on-screen HTML layout of the same document.
- Documents render **on demand** from current row state, never stored as blobs.
- The full Cyrillic glyph set embeds, including `€` and `лв.`
- Long values (IBANs, company names) are never hyphenated.
- Download filenames are Bulgarian (`Фактура_0000000016.pdf`). Transported as an
  ASCII fallback plus an RFC 5987 `filename*` parameter — a raw Cyrillic
  filename in `Content-Disposition` is a hard error at the HTTP layer.

---

## 9. Lifecycle [MVP]

`draft → sent → paid`, plus `overdue` and `cancelled`.

- **draft** — freely editable, unnumbered, not a legal document.
- **sent** — number claimed, snapshots frozen, document immutable.
- **paid** — settled; shows the paid marker.
- **overdue** — past `dueAt` and unpaid.
- **cancelled** — voided; the number is retained and never reissued.

An issued document is corrected by a credit or debit note referencing it, never
by editing it in place.

---

## 10. Surrounding capability

- **Composition** from a blank form or from a saved client and catalogue items,
  with live subtotal / VAT / total as lines are entered. **[MVP]**
- **Client and catalogue management** as first-class screens. **[MVP]**
- **Email delivery** of the document, with the accompanying message stored on
  the record. **[MVP]**
- **Auth** (email + password) and **billing** — credits per issued document
  plus an optional unlimited subscription (§11). **[MVP]**
- **Payment reminders** for overdue documents. **[LATER]**
- **Recurring documents** on a schedule. **[LATER]**
- **Saved templates** for repeated document shapes. **[LATER]**
- **Reporting** — turnover by period, by client, VAT totals, outstanding
  receivables; accountant export. **[LATER]**
- **Multiple visual templates** for the rendered document. **[LATER]** — but the
  renderer takes a template identifier from day one.

---

## 11. Billing [MVP]

Two ways to pay, both through Paddle. Prices are EUR. (Closed 2026-08-09.)

- **Credits, pay-as-you-go.** An account holds a credit balance in integer euro
  cents. Issuing any document — every type in §2 — consumes **10 cents** at the
  moment the number is claimed, inside the same transaction: the deduction and
  the number claim commit or roll back together. If the balance is short,
  issuance is rejected with `INSUFFICIENT_CREDITS` (HTTP 402), no number is
  claimed, and the document stays `draft`. Drafts, clients, catalogue and
  re-rendering of already-issued documents never consume credit.
- **Credit packs.** 5 €, 10 € and 25 € one-time Paddle purchases crediting
  their face value: 500, 1000, 2500 cents. Fulfilment happens on the Paddle
  `transaction.completed` webhook and is idempotent per Paddle transaction id.
- **Subscription, unlimited.** An account with a usable subscription (`active`,
  or `trialing` with a future period end) issues without deduction. Managed
  through Paddle subscription webhooks. Accounts no longer start with a trial
  subscription; a subscription exists only once one is bought.
- **Signup grant.** A new account is granted **100 cents** (10 documents)
  exactly once, in the transaction that creates the account.
- **Ledger.** Every balance change is an append-only ledger entry (signup
  grant, purchase, issuance spend, adjustment). The account balance equals the
  sum of its ledger at all times, and can never go below zero — enforced at the
  database, not just the service.

---

## Invariants

These are the acceptance tests. Each is written before its implementation.

1. Issuing 100 documents across two types on one account produces two gapless
   sequences; creating and abandoning 50 drafts between them changes nothing.
2. Two concurrent issuances on the same `(account, type)` produce consecutive
   numbers, never a duplicate. Test under transaction contention.
3. An overridden next number on a series with no issued documents is honoured;
   the same override once the series has any is rejected with a domain error,
   not a constraint violation.
4. A cancelled document's number is never reissued.
5. Issue a document, then mutate the issuer profile and the client row. Re-render.
   The seller and recipient blocks are byte-identical to the first render.
6. A document issued with a blank `mol` renders a blank `mol` after the profile
   gains one.
7. Any mutation of a document not in `draft` returns 409.
8. `credit_note` and `debit_note` without `originalDocumentId` are rejected at
   creation.
9. `roundHalfUp(eur * 1.95583, 2)` — table-driven, including the half-cent cases.
10. Formatting: `160000` cents renders `1 600,00`; `1075707` renders `10 757,07`.
11. Amount in words, table-driven: 0, 1, 2, 5, 11, 12, 19, 21, 100, 101, 1000,
    1001, 2000, 5500, 1000000, and every cents value 0–99. Feminine and neuter
    forms correct (`ХИЛЯДИ`, `ДВЕ`, `ДВА`).
12. A non-VAT-registered account cannot set an exemption ground; the server
    forces `чл.113, ал.9 от ЗДДС`.
13. A VAT-registered account at 20% has no exemption line at all.
14. Proforma and quote render without `(Оригинал)` and without an exemption line.
15. Quote renders `Валидно до` and no `Данъчно събитие`.
16. `Content-Disposition` for `Фактура_0000000016.pdf` contains an ASCII fallback
    and a correctly percent-encoded UTF-8 `filename*`.
17. A rendered PDF for a document with Cyrillic issuer, client, `€` and `лв.`
    contains no missing-glyph boxes. Assert by text extraction round-trip.
18. An IBAN in a narrow column is not hyphenated or broken mid-string.
19. Issuing any document on an account whose issuer profile is missing or
    incomplete (§4) is rejected with a domain error; the document stays
    `draft`. Saving the draft itself succeeds.
20. Issuing on an account with no usable subscription and a balance of exactly
    10 cents succeeds and leaves 0; the next issuance is rejected with
    `INSUFFICIENT_CREDITS`, claims no number, and the document stays `draft`.
21. Two concurrent issuances on an account holding 10 cents: exactly one
    succeeds, the balance never goes negative, and the ledger matches the
    balance. Test under transaction contention.
22. Delivering the same `transaction.completed` webhook twice credits the pack
    exactly once. After any sequence of grants, purchases and spends,
    `creditBalanceCents` equals the ledger sum.
23. An account with a usable subscription issues with no deduction and no
    ledger entry; when the subscription lapses, issuance falls back to
    credits.
