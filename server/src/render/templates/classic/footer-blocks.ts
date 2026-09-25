import { type DocumentType, getCountryConfig } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { readIdentifiers } from '../../../issuer/identifiers';
import { appendCountyRegionSuffix, cityWithCountyRegion, escapeHtml, line } from './html-utils';
import type { ClassicLocaleContext } from './locale';

// Some countries collect a single free-text addressLine (BG); others collect
// structured street/postcode/city (DE and others via requiredIssuerFields).
// The classic template prints whichever the issuer profile actually has.
function formatIssuerAddress(document: Document, issuerCountry: string): string {
  const city = cityWithCountyRegion(
    document.issuerCity,
    document.issuerCountyRegion,
    issuerCountry,
  );
  const address = document.issuerAddressLine
    ? [document.issuerAddressLine, city].filter(Boolean).join(', ')
    : [document.issuerStreet, [document.issuerPostcode, city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ');
  return appendCountyRegionSuffix(
    address,
    document.issuerCity,
    document.issuerCountyRegion,
    issuerCountry,
  );
}

export function buildIssuerBlock(document: Document, locale: ClassicLocaleContext): string {
  const { labels } = locale;
  const addressLine = formatIssuerAddress(document, locale.issuerCountry);
  const identifiers = readIdentifiers(document.issuerIdentifiers);
  const identifierRows = getCountryConfig(locale.issuerCountry)
    .identifiers.map((field) => line(`${field.label}: `, identifiers[field.key] ?? null))
    .join('');
  const columnOne = [
    `<div class="block-title">${labels.supplierTitle}</div>`,
    document.issuerCompanyName
      ? `<div class="no-break">${escapeHtml(document.issuerCompanyName)}</div>`
      : '',
    line(`${labels.companyIdLabel}: `, document.issuerEik),
    identifierRows,
    line(labels.vatNumberPrefix, document.issuerVatNumber),
    locale.showMol ? line(labels.molPrefix, document.issuerMol) : '',
  ].join('');
  const columnTwo = [
    addressLine ? `<div>${escapeHtml(addressLine)}</div>` : '',
    line(labels.phonePrefix, document.issuerPhone),
  ].join('');
  const columnThree = [
    document.issuerBankName ? `<div>${escapeHtml(document.issuerBankName)}</div>` : '',
    document.issuerIban
      ? `<div class="no-break">IBAN: ${escapeHtml(document.issuerIban)}</div>`
      : '',
    line(labels.bicPrefix, document.issuerBic),
  ].join('');
  return `<div class="issuer-block">
    <div>${columnOne}</div>
    <div>${columnTwo}</div>
    <div>${columnThree}</div>
  </div>`;
}

export function buildSignatureRow(
  document: Document,
  documentType: DocumentType,
  locale: ClassicLocaleContext,
): string {
  const { labels } = locale;
  return `<div class="signature-row">
    <div>${labels.preparedByPrefix(documentType)}${escapeHtml(document.preparedBy ?? '')}</div>
    <div>${labels.recipientSignaturePrefix(documentType)}${escapeHtml(document.recipientMol ?? '')}</div>
  </div>`;
}
