import type { DocumentType } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { formatDateForLocale } from '../../../money/format';
import {
  appendCountyRegionSuffix,
  cityWithCountyRegion,
  countryName,
  escapeHtml,
  identifierLine,
  line,
} from './html-utils';
import type { ClassicLabels } from './labels';
import type { ClassicLocaleContext } from './locale';

// Mirrors formatIssuerAddress in footer-blocks.ts: a legacy client row stores the
// whole address in recipientAddress (with city, if any, folded into that text); a
// client with structured fields keeps recipientAddress as the line before the city
// and prints street, then postcode/city on the same line.
function formatRecipientAddress(document: Document): string {
  const country = document.recipientCountry;
  const city = cityWithCountyRegion(
    document.recipientCity,
    document.recipientCountyRegion,
    country,
  );
  const address = document.recipientStreet
    ? [document.recipientStreet, [document.recipientPostcode, city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ')
    : [document.recipientAddress, city].filter(Boolean).join(', ');
  return appendCountyRegionSuffix(
    address,
    document.recipientCity,
    document.recipientCountyRegion,
    country,
  );
}

function withForeignCountry(
  address: string,
  country: string | null,
  locale: ClassicLocaleContext,
): string {
  if (!address || !country || country === locale.issuerCountry) return address;
  const name = countryName(country, locale.language);
  if (address.toLowerCase().includes(name.toLowerCase())) return address;
  return `${address}, ${name}`;
}

export function buildRecipientBlock(
  document: Document,
  documentType: DocumentType,
  locale: ClassicLocaleContext,
): string {
  const { labels } = locale;
  const recipientAddress = withForeignCountry(
    formatRecipientAddress(document),
    document.recipientCountry,
    locale,
  );
  const rows = [
    document.recipientCompanyName
      ? `<div class="no-break">${escapeHtml(document.recipientCompanyName)}</div>`
      : '',
    recipientAddress ? `<div>${escapeHtml(recipientAddress)}</div>` : '',
    identifierLine(labels.companyIdLabel, document.recipientEik, locale.language),
    line(labels.vatNumberPrefix, document.recipientVatNumber),
    locale.showMol ? line(labels.molPrefix, document.recipientMol) : '',
  ]
    .filter(Boolean)
    .join('');
  return `<div class="recipient"><div class="block-title">${labels.recipientTitle(documentType)}</div>${rows}</div>`;
}

export function buildDatesBlock(
  document: Document,
  documentType: DocumentType,
  locale: ClassicLocaleContext,
): string {
  const { labels } = locale;
  const issuedAt = document.issuedAt
    ? formatDateForLocale(document.issuedAt, locale.language)
    : '—';
  const rows = [`<div>${labels.issuedAtPrefix(documentType)}${issuedAt}</div>`];
  if (documentType === 'quote') {
    const validUntil = document.validUntil
      ? formatDateForLocale(document.validUntil, locale.language)
      : '—';
    rows.push(`<div>${labels.validUntilPrefix(documentType)}${validUntil}</div>`);
  } else if (documentType === 'delivery_note') {
    const deliveryDate = document.deliveryDate
      ? formatDateForLocale(document.deliveryDate, locale.language)
      : '—';
    rows.push(`<div>${labels.deliveryDatePrefix}${deliveryDate}</div>`);
  } else if (documentType !== 'proforma') {
    const taxEventAt = document.taxEventAt
      ? formatDateForLocale(document.taxEventAt, locale.language)
      : '—';
    rows.push(`<div>${labels.taxEventPrefix}${taxEventAt}</div>`);
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
