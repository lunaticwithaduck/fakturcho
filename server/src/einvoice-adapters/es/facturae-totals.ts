import type { DocumentDto, LineItemDto, VatSubtotal } from '@fakturcho/shared-types';
import { textEl, toDecimalString, toPercentString } from './xml';

const IVA_TAX_TYPE_CODE = '01';

export function groupIvaSubtotals(lineItems: readonly LineItemDto[]): VatSubtotal[] {
  const groups = new Map<string, VatSubtotal>();
  for (const line of lineItems) {
    const key = `${line.vatCategory}:${line.vatRateBp}`;
    const vatAmount = Math.round((line.lineTotal * line.vatRateBp) / 10000);
    const existing = groups.get(key);
    if (existing) {
      existing.taxableAmount += line.lineTotal;
      existing.vatAmount += vatAmount;
      continue;
    }
    groups.set(key, {
      vatCategory: line.vatCategory,
      rateBp: line.vatRateBp,
      taxableAmount: line.lineTotal,
      vatAmount,
    });
  }
  return [...groups.values()];
}

function taxBlock(rateBp: number, taxableAmount: number, vatAmount: number): string {
  return (
    '<Tax>' +
    textEl('TaxTypeCode', IVA_TAX_TYPE_CODE) +
    textEl('TaxRate', toPercentString(rateBp)) +
    `<TaxableBase>${textEl('TotalAmount', toDecimalString(taxableAmount))}</TaxableBase>` +
    `<TaxAmount>${textEl('TotalAmount', toDecimalString(vatAmount))}</TaxAmount>` +
    '</Tax>'
  );
}

export function taxesOutputsBlock(lineItems: readonly LineItemDto[]): string {
  const taxes = groupIvaSubtotals(lineItems)
    .map((subtotal) => taxBlock(subtotal.rateBp, subtotal.taxableAmount, subtotal.vatAmount))
    .join('');
  return `<TaxesOutputs>${taxes}</TaxesOutputs>`;
}

export function lineTaxesOutputsBlock(line: LineItemDto): string {
  const vatAmount = Math.round((line.lineTotal * line.vatRateBp) / 10000);
  return `<TaxesOutputs>${taxBlock(line.vatRateBp, line.lineTotal, vatAmount)}</TaxesOutputs>`;
}

export function invoiceTotalsBlock(document: DocumentDto): string {
  const grossBeforeTaxes = document.subtotal - document.discountTotal;
  return (
    '<InvoiceTotals>' +
    textEl('TotalGrossAmount', toDecimalString(document.subtotal)) +
    textEl('TotalGeneralDiscounts', toDecimalString(document.discountTotal)) +
    textEl('TotalGeneralSurcharges', toDecimalString(0)) +
    textEl('TotalGrossAmountBeforeTaxes', toDecimalString(grossBeforeTaxes)) +
    textEl('TotalTaxOutputs', toDecimalString(document.vatAmount)) +
    textEl('TotalTaxesWithheld', toDecimalString(0)) +
    textEl('InvoiceTotal', toDecimalString(document.amount)) +
    textEl('TotalOutstandingAmount', toDecimalString(document.amount)) +
    textEl('TotalExecutableAmount', toDecimalString(document.amount)) +
    '</InvoiceTotals>'
  );
}
