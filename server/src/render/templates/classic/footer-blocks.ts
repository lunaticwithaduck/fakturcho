import type { Document } from '@prisma/client';
import { escapeHtml, line } from './html-utils';
import type { ClassicLocaleContext } from './locale';

export function buildIssuerBlock(document: Document, locale: ClassicLocaleContext): string {
  const { labels } = locale;
  const addressLine = [document.issuerAddressLine, document.issuerCity].filter(Boolean).join(', ');
  const columnOne = [
    document.issuerCompanyName
      ? `<div class="no-break">${escapeHtml(document.issuerCompanyName)}</div>`
      : '',
    line(`${labels.companyIdLabel}: `, document.issuerEik),
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

export function buildSignatureRow(document: Document, locale: ClassicLocaleContext): string {
  const { labels } = locale;
  return `<div class="signature-row">
    <div>${labels.preparedByPrefix}${escapeHtml(document.preparedBy ?? '')}</div>
    <div>${labels.recipientSignaturePrefix}${escapeHtml(document.recipientMol ?? '')}</div>
  </div>`;
}
