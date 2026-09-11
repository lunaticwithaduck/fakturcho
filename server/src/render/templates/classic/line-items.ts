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
): string {
  const { labels, language } = locale;
  const rows = lineItems
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${formatQuantity(item.quantity, language)}</td>
        <td>${formatCentsForLocale(item.unitPrice, language)}</td>
        <td>${formatCentsForLocale(item.lineTotal, language)}</td>
      </tr>`,
    )
    .join('');
  return `<table class="line-items">
    <thead>
      <tr>
        <th>${labels.colName}</th>
        <th>${labels.colQuantity}</th>
        <th>${labels.colPrice}</th>
        <th>${labels.colTotal}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}
