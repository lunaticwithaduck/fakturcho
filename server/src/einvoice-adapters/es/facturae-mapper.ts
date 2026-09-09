import type { DocumentDto, DocumentType } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import { itemsBlock } from './facturae-lines';
import { buyerPartyBlock, sellerPartyBlock } from './facturae-parties';
import { invoiceTotalsBlock, taxesOutputsBlock } from './facturae-totals';
import { dateOnly, textEl, toDecimalString } from './xml';

type FacturaeDocumentType = 'invoice' | 'credit_note' | 'debit_note';

const INVOICE_CLASS: Record<FacturaeDocumentType, 'OO' | 'OR'> = {
  invoice: 'OO',
  debit_note: 'OO',
  credit_note: 'OR',
};

const FACTURAE_NAMESPACE = 'http://www.facturae.es/Facturae/2014/v3.2.1/Facturae';

function assertFacturaeEligible(documentType: DocumentType): FacturaeDocumentType {
  if (
    documentType === 'invoice' ||
    documentType === 'credit_note' ||
    documentType === 'debit_note'
  ) {
    return documentType;
  }
  throw new Error(`toFacturaeXml: document type "${documentType}" has no e-invoice export.`);
}

function fileHeaderBlock(document: DocumentDto): string {
  const totalAmount = toDecimalString(document.amount);
  return (
    '<FileHeader>' +
    textEl('SchemaVersion', '3.2') +
    textEl('Modality', 'I') +
    textEl('InvoiceIssuerType', 'EM') +
    '<Batch>' +
    textEl('BatchIdentifier', document.id) +
    textEl('InvoicesCount', '1') +
    `<TotalInvoicesAmount>${textEl('TotalAmount', totalAmount)}</TotalInvoicesAmount>` +
    `<TotalOutstandingAmount>${textEl('TotalAmount', totalAmount)}</TotalOutstandingAmount>` +
    `<TotalExecutableAmount>${textEl('TotalAmount', totalAmount)}</TotalExecutableAmount>` +
    textEl('InvoiceCurrencyCode', document.currency) +
    '</Batch>' +
    '</FileHeader>'
  );
}

function invoiceHeaderBlock(document: DocumentDto, kind: FacturaeDocumentType): string {
  const documentNumber = document.number !== null ? formatDocumentNumber(document.number) : '';
  const idWithAffixes = `${document.numberPrefix ?? ''}${documentNumber}${document.numberSuffix ?? ''}`;
  return (
    '<InvoiceHeader>' +
    textEl('InvoiceNumber', idWithAffixes) +
    textEl('InvoiceDocumentType', 'FC') +
    textEl('InvoiceClass', INVOICE_CLASS[kind]) +
    '</InvoiceHeader>'
  );
}

function invoiceIssueDataBlock(document: DocumentDto): string {
  const issueDate = document.issuedAt ? dateOnly(document.issuedAt) : '';
  return (
    '<InvoiceIssueData>' +
    textEl('IssueDate', issueDate) +
    textEl('InvoiceCurrencyCode', document.currency) +
    textEl('TaxCurrencyCode', document.currency) +
    textEl('LanguageName', 'es') +
    '</InvoiceIssueData>'
  );
}

export function toFacturaeXml(document: DocumentDto): string {
  const kind = assertFacturaeEligible(document.documentType);

  const invoiceBody =
    invoiceHeaderBlock(document, kind) +
    invoiceIssueDataBlock(document) +
    taxesOutputsBlock(document.lineItems) +
    invoiceTotalsBlock(document) +
    itemsBlock(document.lineItems);

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<Facturae xmlns="${FACTURAE_NAMESPACE}">` +
    fileHeaderBlock(document) +
    `<Parties>${sellerPartyBlock(document.issuer)}${buyerPartyBlock(document.recipient)}</Parties>` +
    `<Invoices><Invoice>${invoiceBody}</Invoice></Invoices>` +
    '</Facturae>'
  );
}
