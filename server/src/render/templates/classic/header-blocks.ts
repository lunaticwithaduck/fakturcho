import { type DocumentType, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { formatDateForLocale } from '../../../money/format';
import { escapeHtml, line } from './html-utils';
import type { ClassicLabels } from './labels';
import type { ClassicLocaleContext } from './locale';

export { buildRecipientBlock } from './recipient-block';

function sameCalendarDate(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

export function buildDatesBlock(
  document: Document,
  documentType: DocumentType,
  locale: ClassicLocaleContext,
): string {
  const { labels } = locale;
  // A draft has no issuedAt yet (it is assigned at issuance, alongside the
  // document number); hide the row rather than print a dash for a date that
  // does not exist yet.
  const rows = document.issuedAt
    ? [
        `<div>${labels.issuedAtPrefix(documentType)}${formatDateForLocale(document.issuedAt, locale.language)}</div>`,
      ]
    : [];
  if (documentType === 'quote') {
    // A draft quote may have no validUntil yet (user-entered, optional at
    // draft stage) — hide the row rather than print a dash.
    if (document.validUntil) {
      const validUntil = formatDateForLocale(document.validUntil, locale.language);
      rows.push(`<div>${labels.validUntilPrefix(documentType)}${validUntil}</div>`);
    }
  } else if (documentType === 'delivery_note') {
    // Delivery date is only ever an optional, user-entered field; a blank one
    // has no fallback (unlike taxEventAt below), so hide the row instead of
    // printing a dash for a date that was never asked for.
    if (document.deliveryDate) {
      const deliveryDate = formatDateForLocale(document.deliveryDate, locale.language);
      rows.push(`<div>${labels.deliveryDatePrefix}${deliveryDate}</div>`);
    }
  } else if (documentType !== 'proforma') {
    // Issuance now stores taxEventAt = issuedAt when the user left it blank
    // (document-issuance.service.ts), so a null value here only happens on a
    // draft or on a document issued before that fix — hide the row rather
    // than print a dash for a mandatory date. Once set, BG and DE print it
    // even when it matches the issue date (their statutes have no "only when
    // different" carve-out); every other country prints it only when it
    // differs from the issue date (EU directive art. 226(7) default).
    const taxEventAt = document.taxEventAt;
    const showTaxEvent =
      taxEventAt !== null &&
      (locale.taxEventDateAlwaysShown ||
        document.issuedAt === null ||
        !sameCalendarDate(taxEventAt, document.issuedAt));
    if (showTaxEvent) {
      const taxEventPrefix =
        locale.issuerCountry === 'CZ' && labels.taxEventDuzpPrefix
          ? labels.taxEventDuzpPrefix
          : labels.taxEventPrefix;
      rows.push(`<div>${taxEventPrefix}${formatDateForLocale(taxEventAt, locale.language)}</div>`);
    }
  }
  if (TAX_DOCUMENT_TYPES[documentType]) {
    rows.push(line(labels.buyerReferencePrefix, document.buyerReference));
    const paymentTerms =
      document.paymentTermsDays != null
        ? labels.paymentTermsDaysText(document.paymentTermsDays)
        : document.paymentTermsNote;
    // EN 16931 BT-9 (dueAt): printed on every tax document except a credit
    // note, which carries no due date. FR already states its own due date in
    // mentions/fr.ts, so it is skipped here to avoid printing it twice.
    const dueAt = document.dueAt;
    const dueDateApplicable = documentType !== 'credit_note' && locale.issuerCountry !== 'FR';
    if (dueAt && dueDateApplicable && locale.issuerCountry === 'PL') {
      // Polish practice merges the due date and the agreed terms into one line
      // rather than printing them as two separate rows.
      const dueDate = formatDateForLocale(dueAt, locale.language);
      const terms = paymentTerms ? ` (${escapeHtml(paymentTerms)})` : '';
      rows.push(`<div>${labels.paymentTermsPrefix}${dueDate}${terms}</div>`);
    } else {
      rows.push(line(labels.paymentTermsPrefix, paymentTerms));
      if (dueAt && dueDateApplicable && labels.dueDatePrefix) {
        rows.push(
          `<div>${labels.dueDatePrefix}${formatDateForLocale(dueAt, locale.language)}</div>`,
        );
      }
    }
  }
  rows.push(buildStatusMarker(document.status, documentType, labels));
  return `<div class="dates">${rows.join('')}</div>`;
}

function buildStatusMarker(
  status: string,
  documentType: DocumentType,
  labels: ClassicLabels,
): string {
  if (status === 'PAID') return `<div class="status">${labels.statusPaid(documentType)}</div>`;
  if (status === 'CANCELLED')
    return `<div class="status">${labels.statusCancelled(documentType)}</div>`;
  return '';
}
