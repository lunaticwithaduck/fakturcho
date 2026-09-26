import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
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

function amountsBlock(document: DocumentDto): string {
  const lines = discountAdjustedLines(
    document.lineItems,
    document.subtotal,
    document.discountTotal,
  );
  const buckets = groupFa3VatBuckets(lines);
  const amountTags = buckets
    .map((bucket) => {
      const net = textEl(bucket.netTag, toDecimalString(bucket.taxableAmount));
      const vat = bucket.vatTag ? textEl(bucket.vatTag, toDecimalString(bucket.vatAmount)) : '';
      return net + vat;
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
    optionalTextEl('PrzyczynaKorekty', document.correctionReason) +
    '</DaneFaKorygowanej>'
  );
}

function annotationsBlock(document: DocumentDto): string {
  const hasReverseCharge = document.lineItems.some((line) => line.vatCategory === 'AE');
  const hasExempt = document.lineItems.some((line) => line.vatCategory === 'E');
  const exemption = hasExempt
    ? `<Zwolnienie>${textEl('P_19', '1')}${optionalTextEl('P_19A', document.vatExemptionGround)}</Zwolnienie>`
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

  const faBody =
    textEl('KodWaluty', document.currency) +
    textEl('P_1', document.issuedAt ? dateOnly(document.issuedAt) : '') +
    textEl('P_2', idWithAffixes) +
    (saleDate ? textEl('P_6', dateOnly(saleDate)) : '') +
    amountsBlock(document) +
    annotationsBlock(document) +
    textEl('RodzajFaktury', RODZAJ_FAKTURY[kind]) +
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
