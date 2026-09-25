import type { DocumentDto } from '@fakturcho/shared-types';
import { discountAdjustedLines } from './discount';
import { groupVatSubtotals } from './vat-grouping';
import { dateOnly, textEl, toDecimalString, toPercentString } from './xml';

export function deliveryBlock(document: DocumentDto): string {
  if (!document.deliveryDate && !document.deliveryAddress) return '';
  const date = document.deliveryDate
    ? textEl('cbc:ActualDeliveryDate', dateOnly(document.deliveryDate))
    : '';
  const location = document.deliveryAddress
    ? `<cac:DeliveryLocation><cac:Address>${textEl('cbc:StreetName', document.deliveryAddress)}</cac:Address></cac:DeliveryLocation>`
    : '';
  return `<cac:Delivery>${date}${location}</cac:Delivery>`;
}

export function paymentMeansBlock(document: DocumentDto): string {
  if (!document.paymentMeansCode) return '';
  const account = document.issuer.iban
    ? '<cac:PayeeFinancialAccount>' +
      textEl('cbc:ID', document.issuer.iban) +
      (document.issuer.bic
        ? `<cac:FinancialInstitutionBranch>${textEl('cbc:ID', document.issuer.bic)}</cac:FinancialInstitutionBranch>`
        : '') +
      '</cac:PayeeFinancialAccount>'
    : '';
  return `<cac:PaymentMeans>${textEl('cbc:PaymentMeansCode', document.paymentMeansCode)}${account}</cac:PaymentMeans>`;
}

export function paymentTermsBlock(document: DocumentDto): string {
  if (!document.paymentTermsNote) return '';
  return `<cac:PaymentTerms>${textEl('cbc:Note', document.paymentTermsNote)}</cac:PaymentTerms>`;
}

export function taxTotalBlock(document: DocumentDto): string {
  const lines = discountAdjustedLines(
    document.lineItems,
    document.subtotal,
    document.discountTotal,
  );
  const subtotalXml = groupVatSubtotals(lines)
    .map((subtotal) => {
      const exemptionReason =
        subtotal.vatCategory !== 'S' && subtotal.vatCategory !== 'Z' && document.vatExemptionGround
          ? textEl('cbc:TaxExemptionReason', document.vatExemptionGround)
          : '';
      return (
        '<cac:TaxSubtotal>' +
        `<cbc:TaxableAmount currencyID="${document.currency}">${toDecimalString(subtotal.taxableAmount)}</cbc:TaxableAmount>` +
        `<cbc:TaxAmount currencyID="${document.currency}">${toDecimalString(subtotal.vatAmount)}</cbc:TaxAmount>` +
        '<cac:TaxCategory>' +
        textEl('cbc:ID', subtotal.vatCategory) +
        textEl('cbc:Percent', toPercentString(subtotal.rateBp)) +
        exemptionReason +
        `<cac:TaxScheme>${textEl('cbc:ID', 'VAT')}</cac:TaxScheme>` +
        '</cac:TaxCategory>' +
        '</cac:TaxSubtotal>'
      );
    })
    .join('');
  return (
    '<cac:TaxTotal>' +
    `<cbc:TaxAmount currencyID="${document.currency}">${toDecimalString(document.vatAmount)}</cbc:TaxAmount>` +
    subtotalXml +
    '</cac:TaxTotal>'
  );
}

export function legalMonetaryTotalBlock(document: DocumentDto): string {
  const taxExclusive = document.subtotal - document.discountTotal;
  const allowance =
    document.discountTotal > 0
      ? `<cbc:AllowanceTotalAmount currencyID="${document.currency}">${toDecimalString(document.discountTotal)}</cbc:AllowanceTotalAmount>`
      : '';
  return (
    '<cac:LegalMonetaryTotal>' +
    `<cbc:LineExtensionAmount currencyID="${document.currency}">${toDecimalString(document.subtotal)}</cbc:LineExtensionAmount>` +
    `<cbc:TaxExclusiveAmount currencyID="${document.currency}">${toDecimalString(taxExclusive)}</cbc:TaxExclusiveAmount>` +
    `<cbc:TaxInclusiveAmount currencyID="${document.currency}">${toDecimalString(document.amount)}</cbc:TaxInclusiveAmount>` +
    allowance +
    `<cbc:PayableAmount currencyID="${document.currency}">${toDecimalString(document.amount)}</cbc:PayableAmount>` +
    '</cac:LegalMonetaryTotal>'
  );
}
