import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
import { formatDocumentNumber, roundHalfUp } from '@fakturcho/shared-types';
import { discountAdjustedLines } from '../../einvoice/discount';
import { lineBlock } from './fa3-lines';
import { buyerParty, sellerParty } from './fa3-parties';
import { groupFa3VatBuckets } from './fa3-vat-groups';
import { dateOnly, optionalTextEl, textEl, toDecimalString } from './xml-escape';

type Fa3DocumentType = 'invoice' | 'credit_note' | 'debit_note';

// debit_note is a faktura korygująca in plus (art. 106j ustawy o VAT), the
// same RodzajFaktury as a credit_note — not a fresh VAT invoice.
const RODZAJ_FAKTURY: Record<Fa3DocumentType, string> = {
  invoice: 'VAT',
  credit_note: 'KOR',
  debit_note: 'KOR',
};

const FA3_NAMESPACE = 'http://crd.gov.pl/wzor/2025/06/25/13775/';

function assertFa3Eligible(documentType: DocumentType): Fa3DocumentType {
  if (
    documentType === 'invoice' ||
    documentType === 'credit_note' ||
    documentType === 'debit_note'
  ) {
    return documentType;
  }
  throw new Error(`toFa3Xml: document type "${documentType}" has no FA(3) export.`);
}

function headerBlock(generatedAt: string): string {
  return (
    '<Naglowek>' +
    '<KodFormularza kodSystemowy="FA (3)" wersjaSchemy="1-0E">FA</KodFormularza>' +
    '<WariantFormularza>3</WariantFormularza>' +
    textEl('DataWytworzeniaFa', generatedAt) +
    textEl('SystemInfo', 'fakturcho') +
    '</Naglowek>'
  );
}

// art. 106e ust. 11 ustawy: a foreign-currency invoice also carries the VAT
// converted to PLN (P_14_xW), using the same exchange-rate snapshot already
// resolved for the PDF's local-currency VAT line — never a freshly fetched
// rate.
function amountsBlock(document: DocumentDto): string {
  const lines = discountAdjustedLines(
    document.lineItems,
    document.subtotal,
    document.discountTotal,
  );
  const buckets = groupFa3VatBuckets(lines);
  const localRate = document.exchangeRate ? Number(document.exchangeRate) : null;
  const amountTags = buckets
    .map((bucket) => {
      const net = textEl(bucket.netTag, toDecimalString(bucket.taxableAmount));
      if (!bucket.vatTag) return net;
      const vat = textEl(bucket.vatTag, toDecimalString(bucket.vatAmount));
      const vatLocal =
        localRate !== null
          ? textEl(
              `${bucket.vatTag}W`,
              toDecimalString(roundHalfUp(bucket.vatAmount * localRate, 0)),
            )
          : '';
      return net + vat + vatLocal;
    })
    .join('');
  return amountTags + textEl('P_15', toDecimalString(document.amount));
}

// DaneFaKorygowanej is required for RodzajFaktury=KOR (art. 106j ustawy o VAT):
// the corrected invoice's date, number, and either its KSeF number or a
// marker that it was issued outside KSeF.
function correctionBlock(document: DocumentDto): string {
  const original = document.originalDocument;
  if (!original || original.number === null || !original.issuedAt) {
    throw new Error(
      'toFa3Xml: a KOR invoice requires a resolvable original document (DaneFaKorygowanej).',
    );
  }
  const originalNumber =
    (original.numberPrefix ?? '') +
    formatDocumentNumber(original.number) +
    (original.numberSuffix ?? '');
  const ksefBlock = original.ksefNumber
    ? textEl('NrKSeF', '1') + textEl('NrKSeFFaKorygowanej', original.ksefNumber)
    : textEl('NrKSeFN', '1');
  return (
    '<DaneFaKorygowanej>' +
    textEl('DataWystFaKorygowanej', original.issuedAt) +
    textEl('NrFaKorygowanej', originalNumber) +
    ksefBlock +
    '</DaneFaKorygowanej>'
  );
}

// XSD/broszura FA(3): "W przypadku, gdy pole P_19 równa się 1, należy
// wypełnić dodatkowo jedno z pól: P_19A, P_19B lub P_19C" — P_19=1 without a
// ground is not schema-valid, so an E line with no vatExemptionGround must
// fail readiness (checkFa3Readiness) before it ever reaches the mapper.
function annotationsBlock(document: DocumentDto): string {
  const hasReverseCharge = document.lineItems.some((line) => line.vatCategory === 'AE');
  const hasExempt = document.lineItems.some((line) => line.vatCategory === 'E');
  if (hasExempt && !document.vatExemptionGround) {
    throw new Error(
      'toFa3Xml: an exempt (E) line requires vatExemptionGround for P_19A (XSD requires P_19A/B/C when P_19=1).',
    );
  }
  const exemption = hasExempt
    ? `<Zwolnienie>${textEl('P_19', '1')}${textEl('P_19A', document.vatExemptionGround as string)}</Zwolnienie>`
    : `<Zwolnienie>${textEl('P_19N', '1')}</Zwolnienie>`;
  return (
    '<Adnotacje>' +
    textEl('P_16', '2') +
    textEl('P_17', '2') +
    textEl('P_18', hasReverseCharge ? '1' : '2') +
    textEl('P_18A', '2') +
    exemption +
    `<NoweSrodkiTransportu>${textEl('P_22N', '1')}</NoweSrodkiTransportu>` +
    textEl('P_23', '2') +
    `<PMarzy>${textEl('P_PMarzyN', '1')}</PMarzy>` +
    '</Adnotacje>'
  );
}

export function toFa3Xml(document: DocumentDto): string {
  const kind = assertFa3Eligible(document.documentType);
  const documentNumber = document.number !== null ? formatDocumentNumber(document.number) : '';
  const idWithAffixes = `${document.numberPrefix ?? ''}${documentNumber}${document.numberSuffix ?? ''}`;
  const generatedAt = `${document.issuedAt ? dateOnly(document.issuedAt) : dateOnly(document.createdAt)}T00:00:00Z`;
  // Matches the PDF's "Data sprzedaży" (header-blocks.ts), which reads taxEventAt.
  const saleDate = document.taxEventAt ?? document.deliveryDate;
  const saleDateOnly = saleDate ? dateOnly(saleDate) : null;
  const issueDateOnly = document.issuedAt ? dateOnly(document.issuedAt) : null;

  const faBody =
    textEl('KodWaluty', document.currency) +
    textEl('P_1', issueDateOnly ?? '') +
    textEl('P_2', idWithAffixes) +
    // XSD/broszura P_6: "o ile taka data jest określona i różni się od daty
    // wystawienia faktury" — only filled when it differs from P_1.
    (saleDateOnly && saleDateOnly !== issueDateOnly ? textEl('P_6', saleDateOnly) : '') +
    amountsBlock(document) +
    annotationsBlock(document) +
    textEl('RodzajFaktury', RODZAJ_FAKTURY[kind]) +
    // XSD: PrzyczynaKorekty is a direct child of Fa, right after
    // RodzajFaktury and before TypKorekty/DaneFaKorygowanej — not nested
    // inside DaneFaKorygowanej.
    (kind === 'invoice' ? '' : optionalTextEl('PrzyczynaKorekty', document.correctionReason)) +
    (kind === 'invoice' ? '' : correctionBlock(document)) +
    document.lineItems.map((line, index) => lineBlock(line, index)).join('');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<Faktura xmlns="${FA3_NAMESPACE}">` +
    headerBlock(generatedAt) +
    sellerParty(document.issuer) +
    buyerParty(document.recipient) +
    `<Fa>${faBody}</Fa>` +
    '</Faktura>'
  );
}
