import type { LineItemDto } from '@fakturcho/shared-types';
import { toFacturaeUnitOfMeasure } from './facturae-countries';
import { lineTaxesOutputsBlock } from './facturae-totals';
import { textEl, toDecimalString, toQuantityString } from './xml';

function invoiceLineBlock(line: LineItemDto): string {
  return (
    '<InvoiceLine>' +
    textEl('ItemDescription', line.name) +
    textEl('Quantity', toQuantityString(line.quantity)) +
    textEl('UnitOfMeasure', toFacturaeUnitOfMeasure(line.unitCode)) +
    textEl('UnitPriceWithoutTax', toDecimalString(line.unitPrice)) +
    textEl('TotalCost', toDecimalString(line.lineTotal)) +
    textEl('GrossAmount', toDecimalString(line.lineTotal)) +
    lineTaxesOutputsBlock(line) +
    '</InvoiceLine>'
  );
}

export function itemsBlock(lineItems: readonly LineItemDto[]): string {
  return `<Items>${lineItems.map(invoiceLineBlock).join('')}</Items>`;
}
