import type { LineItem } from '@prisma/client';
import { formatCents } from '../../../money/format';
import { escapeHtml } from './html-utils';
import type { ClassicLocaleContext } from './locale';

function formatQuantity(raw: unknown): string {
  const numeric = Number(raw);
  if (Number.isInteger(numeric)) return String(numeric);
  const trimmed = numeric.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return trimmed.replace('.', ',');
}

export function buildLineItemsTable(
  lineItems: readonly LineItem[],
  locale: ClassicLocaleContext,
): string {
  const { labels } = locale;
  const rows = lineItems
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${formatQuantity(item.quantity)}</td>
        <td>${formatCents(item.unitPrice)}</td>
        <td>${formatCents(item.lineTotal)}</td>
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
