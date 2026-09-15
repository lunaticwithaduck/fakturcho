import { type DocumentType, getCountryConfig } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { readIdentifiers } from '../../../issuer/identifiers';
import { escapeHtml, line } from './html-utils';
import type { ClassicLocaleContext } from './locale';

// Some countries collect a single free-text addressLine (BG); others collect
// structured street/postcode/city (DE and others via requiredIssuerFields).
// The classic template prints whichever the issuer profile actually has.
function formatIssuerAddress(document: Document): string {
  if (document.issuerAddressLine) {
    return [document.issuerAddressLine, document.issuerCity].filter(Boolean).join(', ');
  }
  const postcodeCity = [document.issuerPostcode, document.issuerCity].filter(Boolean).join(' ');
  return [document.issuerStreet, postcodeCity].filter(Boolean).join(', ');
}

export function buildIssuerBlock(document: Document, locale: ClassicLocaleContext): string {
  const { labels } = locale;
  const addressLine = formatIssuerAddress(document);
  const identifiers = readIdentifiers(document.issuerIdentifiers);
  const identifierRows = getCountryConfig(locale.issuerCountry)
    .identifiers.map((field) => line(`${field.label}: `, identifiers[field.key] ?? null))
    .join('');
  const columnOne = [
    document.issuerCompanyName
      ? `<div class="no-break">${escapeHtml(document.issuerCompanyName)}</div>`
      : '',
    line(`${labels.companyIdLabel}: `, document.issuerEik),
    identifierRows,
    locale.showMol ? line(labels.molPrefix, document.issuerMol) : '',
  ].join('');
  const columnTwo = [
    addressLine ? `<div>${escapeHtml(addressLine)}</div>` : '',
    line(labels.phonePrefix, document.issuerPhone),
  ].join('');
  const columnThree = [
    document.issuerBankName ? `<div>${escapeHtml(document.issuerBankName)}</div>` : '',
    document.issuerIban ? `<div class="no-break">${escapeHtml(document.issuerIban)}</div>` : '',
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
