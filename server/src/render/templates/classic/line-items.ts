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

// Space before "%" for de/fr per DIN 5008 / French typography; decimal comma
// wherever the language uses one (money/format.ts CONVENTIONS).
function formatPercentForLocale(rateBp: number, language: ClassicLanguage): string {
  const value = String(rateBp / 100).replace('.', decimalSeparatorForLocale(language));
  return language === 'de' || language === 'fr' ? `${value} %` : `${value}%`;
}

function formatLineVatRate(
  item: LineItem,
  labels: ClassicLabels,
  language: ClassicLanguage,
  issuerCountry: string,
  issuerVatRegistered: boolean,
): string {
  if (item.vatCategory === 'AE') return labels.reverseChargeLineMarker;
  // art. 106e ust. 1 pkt 12 + ust. 4 pkt 3 ustawy o VAT: the Polish paper
  // convention for an exempt or out-of-scope line, distinct from the FA(3)
  // XML codes in einvoice-adapters/pl/fa3-vat-groups.ts.
  if (issuerCountry === 'PL') {
    if (item.vatCategory === 'E') return 'zw';
    if (item.vatCategory === 'O') return 'np.';
  }
  if (!issuerVatRegistered && item.vatRateBp === 0) return labels.reverseChargeLineMarker;
  return formatPercentForLocale(item.vatRateBp, language);
}

function hasMixedVatRates(lineItems: readonly LineItem[]): boolean {
  return new Set(lineItems.map((item) => `${item.vatCategory}:${item.vatRateBp}`)).size > 1;
}

export function buildLineItemsTable(
  lineItems: readonly LineItem[],
  locale: ClassicLocaleContext,
  documentType: DocumentType,
  showPrices = true,
  issuerVatRegistered = true,
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
      ? `<td class="col-narrow">${escapeHtml(formatLineVatRate(item, labels, language, issuerCountry, issuerVatRegistered))}</td>`
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
