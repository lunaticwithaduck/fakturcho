import { type DocumentType, getCountryConfig } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { readIdentifiers } from '../../../issuer/identifiers';
import {
  appendCountyRegionSuffix,
  cityWithCountyRegion,
  escapeHtml,
  identifierLine,
  labelled,
  line,
} from './html-utils';
import type { ClassicLocaleContext } from './locale';

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

function groupIban(iban: string): string {
  return iban.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');
}

export function buildIssuerBlock(
  document: Document,
  documentType: DocumentType,
  locale: ClassicLocaleContext,
): string {
  const { labels, language } = locale;
  const addressLine = formatIssuerAddress(document, locale.issuerCountry);
  const identifiers = readIdentifiers(document.issuerIdentifiers);
  const identifierRows = getCountryConfig(locale.issuerCountry)
    .identifiers.map((field) =>
      identifierLine(field.label, identifiers[field.key] ?? null, language),
    )
    .join('');
  const columnOne = [
    `<div class="block-title">${labels.supplierTitle}</div>`,
    document.issuerCompanyName
      ? `<div class="no-break">${escapeHtml(document.issuerCompanyName)}</div>`
      : '',
    identifierLine(labels.companyIdLabel, document.issuerEik, language),
    identifierRows,
    line(labels.vatNumberPrefix, document.issuerVatNumber),
    locale.showMol ? line(labels.molPrefix, document.issuerMol) : '',
  ].join('');
  const columnTwo = [
    addressLine ? `<div>${escapeHtml(addressLine)}</div>` : '',
    line(labels.phonePrefix, document.issuerPhone),
  ].join('');
  const columnThree =
    documentType === 'delivery_note'
      ? ''
      : [
          document.issuerBankName ? `<div>${escapeHtml(document.issuerBankName)}</div>` : '',
          document.issuerIban
            ? `<div class="no-break">${labelled('IBAN', language)}${escapeHtml(groupIban(document.issuerIban))}</div>`
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
