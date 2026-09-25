import { type DocumentType, TAX_DOCUMENT_TYPES, type UnitCode } from '@fakturcho/shared-types';
import type { LineItem } from '@prisma/client';
import { decimalSeparatorForLocale, formatCentsForLocale } from '../../../money/format';
import { escapeHtml } from './html-utils';
import type { ClassicLabels, ClassicLanguage } from './labels';
import type { ClassicLocaleContext } from './locale';

function formatQuantity(raw: unknown, language: ClassicLanguage, sign: 1 | -1 = 1): string {
  const numeric = Number(raw) * sign;
  if (Number.isInteger(numeric)) return String(numeric);
  const trimmed = numeric.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return trimmed.replace('.', decimalSeparatorForLocale(language));
}

function formatUnit(unitCode: string | null, labels: ClassicLabels): string {
  if (!unitCode) return '—';
  return labels.unitLabels[unitCode as UnitCode] ?? unitCode;
}

function formatLineVatRate(item: LineItem, labels: ClassicLabels): string {
  if (item.vatCategory === 'AE') return labels.reverseChargeLineMarker;
  return `${item.vatRateBp / 100}%`;
}

function hasMixedVatRates(lineItems: readonly LineItem[]): boolean {
  return new Set(lineItems.map((item) => `${item.vatCategory}:${item.vatRateBp}`)).size > 1;
}

export function buildLineItemsTable(
  lineItems: readonly LineItem[],
  locale: ClassicLocaleContext,
  documentType: DocumentType,
  showPrices = true,
): string {
  const { labels, language, issuerCountry } = locale;
  const sign = documentType === 'credit_note' ? -1 : 1;
  const isTaxDocument = TAX_DOCUMENT_TYPES[documentType];
  const showUnitColumn =
    (issuerCountry === 'PL' && isTaxDocument) || lineItems.some((item) => item.unitCode);
  const showVatRateColumn =
    (issuerCountry === 'PL' && isTaxDocument) || hasMixedVatRates(lineItems);

  const priceCells = (item: LineItem) =>
    showPrices
      ? `<td>${formatCentsForLocale(item.unitPrice, language)}</td>
        <td>${formatCentsForLocale(item.lineTotal * sign, language)}</td>`
      : '';
  const unitCell = (item: LineItem) =>
    showUnitColumn
      ? `<td class="col-narrow">${escapeHtml(formatUnit(item.unitCode, labels))}</td>`
      : '';
  const vatRateCell = (item: LineItem) =>
    showVatRateColumn
      ? `<td class="col-narrow">${escapeHtml(formatLineVatRate(item, labels))}</td>`
      : '';

  const rows = lineItems
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${formatQuantity(item.quantity, language, sign)}</td>
        ${unitCell(item)}
        ${vatRateCell(item)}
        ${priceCells(item)}
      </tr>`,
    )
    .join('');
  const priceHeaders = showPrices
    ? `<th>${labels.colPrice}</th>
        <th>${labels.colTotal}</th>`
    : '';
  const unitHeader = showUnitColumn ? `<th class="col-narrow">${labels.colUnit}</th>` : '';
  const vatRateHeader = showVatRateColumn ? `<th class="col-narrow">${labels.colVatRate}</th>` : '';
  return `<table class="line-items">
    <thead>
      <tr>
        <th>${labels.colName}</th>
        <th>${labels.colQuantity}</th>
        ${unitHeader}
        ${vatRateHeader}
        ${priceHeaders}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}
