import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import { lineBlock } from './fa3-lines';
import { buyerParty, sellerParty } from './fa3-parties';
import { groupFa3VatBuckets } from './fa3-vat-groups';
import { dateOnly, optionalTextEl, textEl, toDecimalString } from './xml-escape';

type Fa3DocumentType = 'invoice' | 'credit_note' | 'debit_note';

const RODZAJ_FAKTURY: Record<Fa3DocumentType, string> = {
  invoice: 'VAT',
  credit_note: 'KOR',
  debit_note: 'VAT',
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
  const buckets = groupFa3VatBuckets(document.lineItems);
  const amountTags = buckets
    .map((bucket) => {
      const net = textEl(bucket.netTag, toDecimalString(bucket.taxableAmount));
      const vat = bucket.vatTag ? textEl(bucket.vatTag, toDecimalString(bucket.vatAmount)) : '';
      return net + vat;
    })
    .join('');
  return amountTags + textEl('P_15', toDecimalString(document.amount));
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

  const faBody =
    textEl('KodWaluty', document.currency) +
    textEl('P_1', document.issuedAt ? dateOnly(document.issuedAt) : '') +
    textEl('P_2', idWithAffixes) +
    (document.deliveryDate ? textEl('P_6', dateOnly(document.deliveryDate)) : '') +
    textEl('RodzajFaktury', RODZAJ_FAKTURY[kind]) +
    document.lineItems.map((line, index) => lineBlock(line, index)).join('') +
    amountsBlock(document) +
    annotationsBlock(document);

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
