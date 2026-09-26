import type { DocumentDto, DocumentType, LineItemDto } from '@fakturcho/shared-types';
import { formatDocumentNumber, roundHalfUp } from '@fakturcho/shared-types';
import { discountAdjustedLines } from '../../einvoice/discount';
import { annotationsBlock, type Fa3DocumentType } from './fa3-annotations';
import { lineBlock } from './fa3-lines';
import { buyerParty, sellerParty } from './fa3-parties';
import { paymentBlock } from './fa3-payment';
import { groupFa3VatBuckets } from './fa3-vat-groups';
import { dateOnly, optionalTextEl, textEl, toDecimalString } from './xml-escape';

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
//
// Every bucket is summed and rounded from positive line amounts (fa3-vat-
// groups.ts / computeVatSubtotals), then the sign is applied last, so a
// credit note's negative figures round to the same absolute value as the
// PDF (line-items.ts / totals-block.ts `sign`).
function amountsBlock(document: DocumentDto, lines: readonly LineItemDto[], sign: 1 | -1): string {
  const buckets = groupFa3VatBuckets(lines);
  const localRate = document.exchangeRate ? Number(document.exchangeRate) : null;
  const amountTags = buckets
    .map((bucket) => {
      const net = textEl(bucket.netTag, toDecimalString(bucket.taxableAmount * sign));
      if (!bucket.vatTag) return net;
      const vat = textEl(bucket.vatTag, toDecimalString(bucket.vatAmount * sign));
      const vatLocal =
        localRate !== null
          ? textEl(
              `${bucket.vatTag}W`,
              toDecimalString(roundHalfUp(bucket.vatAmount * localRate, 0) * sign),
            )
          : '';
      return net + vat + vatLocal;
    })
    .join('');
  return amountTags + textEl('P_15', toDecimalString(document.amount * sign));
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

export function toFa3Xml(document: DocumentDto): string {
  const kind = assertFa3Eligible(document.documentType);
  // art. 106j ust. 2 pkt 5 ustawy / broszura FA(3) "kwota różnicy": a credit
  // note carries the difference with a minus sign so the XML's absolute
  // values match the PDF (line-items.ts / totals-block.ts `sign`); a debit
  // note (correction in plus) stays positive.
  const sign: 1 | -1 = kind === 'credit_note' ? -1 : 1;
  const documentNumber = document.number !== null ? formatDocumentNumber(document.number) : '';
  const idWithAffixes = `${document.numberPrefix ?? ''}${documentNumber}${document.numberSuffix ?? ''}`;
  const generatedAt = `${document.issuedAt ? dateOnly(document.issuedAt) : dateOnly(document.createdAt)}T00:00:00Z`;
  // Matches the PDF's "Data sprzedaży" (header-blocks.ts), which reads taxEventAt.
  const saleDate = document.taxEventAt ?? document.deliveryDate;
  const saleDateOnly = saleDate ? dateOnly(saleDate) : null;
  const issueDateOnly = document.issuedAt ? dateOnly(document.issuedAt) : null;
  const discountedLines = discountAdjustedLines(
    document.lineItems,
    document.subtotal,
    document.discountTotal,
  );
  // Broszura FA(3): "podaje się kurs waluty właściwy dla danego wiersza" —
  // the document only ever resolves one snapshot rate (the same one the
  // PDF's local-currency VAT line prints), so every line carries it.
  const kursWaluty = document.exchangeRate ?? null;
  const hasWdtOrArt100Services = document.lineItems.some(
    (line) => line.vatCategory === 'K' || line.vatCategory === 'AE',
  );

  const faBody =
    textEl('KodWaluty', document.currency) +
    textEl('P_1', issueDateOnly ?? '') +
    textEl('P_2', idWithAffixes) +
    // XSD/broszura P_6: "o ile taka data jest określona i różni się od daty
    // wystawienia faktury" — only filled when it differs from P_1.
    (saleDateOnly && saleDateOnly !== issueDateOnly ? textEl('P_6', saleDateOnly) : '') +
    amountsBlock(document, discountedLines, sign) +
    annotationsBlock(document, kind) +
    textEl('RodzajFaktury', RODZAJ_FAKTURY[kind]) +
    // XSD: PrzyczynaKorekty is a direct child of Fa, right after
    // RodzajFaktury and before TypKorekty/DaneFaKorygowanej — not nested
    // inside DaneFaKorygowanej.
    (kind === 'invoice' ? '' : optionalTextEl('PrzyczynaKorekty', document.correctionReason)) +
    (kind === 'invoice' ? '' : correctionBlock(document)) +
    document.lineItems
      .map((line, index) =>
        lineBlock(line, discountedLines[index] ?? line, index, sign, kursWaluty),
      )
      .join('') +
    paymentBlock(document);

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<Faktura xmlns="${FA3_NAMESPACE}">` +
    headerBlock(generatedAt) +
    sellerParty(document.issuer, hasWdtOrArt100Services) +
    buyerParty(document.recipient) +
    `<Fa>${faBody}</Fa>` +
    '</Faktura>'
  );
}
