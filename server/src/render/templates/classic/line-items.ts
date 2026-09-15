import type { LineItem } from '@prisma/client';
import { formatCentsForLocale } from '../../../money/format';
import { escapeHtml } from './html-utils';
import type { ClassicLanguage } from './labels';
import type { ClassicLocaleContext } from './locale';

function formatQuantity(raw: unknown, language: ClassicLanguage): string {
  const numeric = Number(raw);
  if (Number.isInteger(numeric)) return String(numeric);
  const trimmed = numeric.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return language === 'bg' ? trimmed.replace('.', ',') : trimmed;
}

export function buildLineItemsTable(
  lineItems: readonly LineItem[],
  locale: ClassicLocaleContext,
  showPrices = true,
): string {
  const { labels, language } = locale;
  const priceCells = (item: LineItem) =>
    showPrices
      ? `<td>${formatCentsForLocale(item.unitPrice, language)}</td>
        <td>${formatCentsForLocale(item.lineTotal, language)}</td>`
      : '';
  const rows = lineItems
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${formatQuantity(item.quantity, language)}</td>
        ${priceCells(item)}
      </tr>`,
    )
    .join('');
  const priceHeaders = showPrices
    ? `<th>${labels.colPrice}</th>
        <th>${labels.colTotal}</th>`
    : '';
  return `<table class="line-items">
    <thead>
      <tr>
        <th>${labels.colName}</th>
        <th>${labels.colQuantity}</th>
        ${priceHeaders}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}
