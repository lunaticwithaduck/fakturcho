import { type DocumentType, TAX_DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { formatDateForLocale } from '../../../money/format';
import {
  addressContainsCity,
  appendCountyRegionSuffix,
  cityWithCountyRegion,
  countryName,
  escapeHtml,
  identifierLine,
  keepAbbreviationsWithNextWord,
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
    : [
        document.recipientAddress,
        addressContainsCity(document.recipientAddress, document.recipientCity) ? '' : city,
      ]
        .filter(Boolean)
        .join(', ');
  return appendCountyRegionSuffix(
    address,
    document.recipientCity,
    document.recipientCountyRegion,
    country,
  );
}

// Codul fiscal art. 316/317: the "RO" prefix denotes VAT registration, so a
// non-VAT-registered party's bare CUI must print without it. Mirrors
// stripUnregisteredRoCuiPrefix in footer-blocks.ts for the recipient side.
function stripUnregisteredRoCuiPrefix(
  eik: string | null,
  issuerCountry: string,
  vatRegistered: boolean,
): string | null {
  if (issuerCountry !== 'RO' || vatRegistered || !eik) return eik;
  const stripped = eik.replace(/^ro/i, '').trim();
  return stripped || eik;
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
  const isForeignEuVatNumber =
    Boolean(document.recipientCountry) && document.recipientCountry !== 'IT';
  const vatNumberPrefix =
    isForeignEuVatNumber && labels.foreignVatNumberPrefix
      ? labels.foreignVatNumberPrefix
      : labels.vatNumberPrefix;
  const rows = [
    document.recipientCompanyName
      ? `<div class="no-break">${escapeHtml(document.recipientCompanyName)}</div>`
      : '',
    recipientAddress
      ? `<div>${keepAbbreviationsWithNextWord(escapeHtml(recipientAddress), locale.language)}</div>`
      : '',
    identifierLine(
      labels.companyIdLabel,
      stripUnregisteredRoCuiPrefix(
        document.recipientEik,
        locale.issuerCountry,
        Boolean(document.recipientVatNumber),
      ),
      locale.language,
    ),
    line(vatNumberPrefix, document.recipientVatNumber),
    locale.showMol ? line(labels.molPrefix, document.recipientMol) : '',
  ]
    .filter(Boolean)
    .join('');
  return `<div class="recipient"><div class="block-title">${labels.recipientTitle(documentType)}</div>${rows}</div>`;
}

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
    rows.push(line(labels.paymentTermsPrefix, paymentTerms));
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
