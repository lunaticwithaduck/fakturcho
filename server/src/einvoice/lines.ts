import type { CurrencyCode, LineItemDto } from '@fakturcho/shared-types';
import { escapeXml, textEl, toDecimalString, toPercentString } from './xml';

export function lineBlock(
  line: LineItemDto,
  currency: CurrencyCode,
  lineTag: string,
  quantityTag: string,
  index: number,
): string {
  const unitCode = line.unitCode ?? 'C62';
  return (
    `<${lineTag}>` +
    textEl('cbc:ID', String(index + 1)) +
    `<${quantityTag} unitCode="${escapeXml(unitCode)}">${escapeXml(line.quantity)}</${quantityTag}>` +
    `<cbc:LineExtensionAmount currencyID="${currency}">${toDecimalString(line.lineTotal)}</cbc:LineExtensionAmount>` +
    '<cac:Item>' +
    textEl('cbc:Name', line.name) +
    '<cac:ClassifiedTaxCategory>' +
    textEl('cbc:ID', line.vatCategory) +
    textEl('cbc:Percent', toPercentString(line.vatRateBp)) +
    `<cac:TaxScheme>${textEl('cbc:ID', 'VAT')}</cac:TaxScheme>` +
    '</cac:ClassifiedTaxCategory>' +
    '</cac:Item>' +
    `<cac:Price><cbc:PriceAmount currencyID="${currency}">${toDecimalString(line.unitPrice)}</cbc:PriceAmount></cac:Price>` +
    `</${lineTag}>`
  );
}
