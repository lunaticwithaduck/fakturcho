import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import { lineBlock } from './lines';
import {
  deliveryBlock,
  legalMonetaryTotalBlock,
  paymentMeansBlock,
  paymentTermsBlock,
  taxTotalBlock,
} from './monetary';
import { customerParty, supplierParty } from './parties';
import { dateOnly, textEl } from './xml';

type EinvoiceDocumentType = 'invoice' | 'credit_note' | 'debit_note';

const DOCUMENT_TYPE_CODES: Record<EinvoiceDocumentType, string> = {
  invoice: '380',
  credit_note: '381',
  debit_note: '383',
};

const CUSTOMIZATION_ID =
  'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0';
const PROFILE_ID = 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0';

function assertEinvoiceEligible(documentType: DocumentType): EinvoiceDocumentType {
  if (
    documentType === 'invoice' ||
    documentType === 'credit_note' ||
    documentType === 'debit_note'
  ) {
    return documentType;
  }
  throw new Error(`toUblXml: document type "${documentType}" has no e-invoice export.`);
}

export function toUblXml(document: DocumentDto): string {
  const kind = assertEinvoiceEligible(document.documentType);
  const isCreditNote = kind === 'credit_note';
  const root = isCreditNote ? 'CreditNote' : 'Invoice';
  const typeCodeTag = isCreditNote ? 'cbc:CreditNoteTypeCode' : 'cbc:InvoiceTypeCode';
  const lineTag = isCreditNote ? 'cac:CreditNoteLine' : 'cac:InvoiceLine';
  const quantityTag = isCreditNote ? 'cbc:CreditedQuantity' : 'cbc:InvoicedQuantity';

  const documentNumber = document.number !== null ? formatDocumentNumber(document.number) : '';
  const idWithAffixes = `${document.numberPrefix ?? ''}${documentNumber}${document.numberSuffix ?? ''}`;

  const header =
    textEl('cbc:CustomizationID', CUSTOMIZATION_ID) +
    textEl('cbc:ProfileID', PROFILE_ID) +
    textEl('cbc:ID', idWithAffixes) +
    (document.issuedAt ? textEl('cbc:IssueDate', dateOnly(document.issuedAt)) : '') +
    (document.dueAt ? textEl('cbc:DueDate', dateOnly(document.dueAt)) : '') +
    textEl(typeCodeTag, DOCUMENT_TYPE_CODES[kind]) +
    textEl('cbc:DocumentCurrencyCode', document.currency) +
    (document.buyerReference ? textEl('cbc:BuyerReference', document.buyerReference) : '');

  const body =
    supplierParty(document.issuer) +
    customerParty(document.recipient) +
    deliveryBlock(document) +
    paymentMeansBlock(document) +
    paymentTermsBlock(document) +
    taxTotalBlock(document) +
    legalMonetaryTotalBlock(document);

  const lines = document.lineItems
    .map((line, index) => lineBlock(line, document.currency, lineTag, quantityTag, index))
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<${root} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${root}-2" ` +
    'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" ' +
    'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">' +
    header +
    body +
    lines +
    `</${root}>`
  );
}
