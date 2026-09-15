import type { Document } from '@prisma/client';
import { formatDateTimeForLocale } from '../../../money/format';
import { line } from './html-utils';
import type { ClassicLocaleContext } from './locale';

// delivery_note only: causale del trasporto / RO scop, carrier and free transport
// notes. Renders nothing when the document carries none of these.
export function buildTransportBlock(document: Document, locale: ClassicLocaleContext): string {
  const { labels } = locale;
  const rows = [
    line(labels.transportReasonPrefix, document.transportReason),
    document.transportedAt
      ? `<div>${labels.transportedAtPrefix}${formatDateTimeForLocale(document.transportedAt, locale.language)}</div>`
      : '',
    line(labels.carrierNamePrefix, document.carrierName),
    line(labels.transportNotePrefix, document.transportNote),
  ]
    .filter(Boolean)
    .join('');
  if (!rows) return '';
  return `<div class="transport">${rows}</div>`;
}
