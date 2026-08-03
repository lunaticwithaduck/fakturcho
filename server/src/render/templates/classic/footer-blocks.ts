import type { Document } from '@prisma/client';
import { escapeHtml, line } from './html-utils';

export function buildIssuerBlock(document: Document): string {
  const addressLine = [document.issuerAddressLine, document.issuerCity].filter(Boolean).join(', ');
  const columnOne = [
    document.issuerCompanyName
      ? `<div class="no-break">${escapeHtml(document.issuerCompanyName)}</div>`
      : '',
    line('ЕИК: ', document.issuerEik),
    line('МОЛ: ', document.issuerMol),
  ].join('');
  const columnTwo = [
    addressLine ? `<div>${escapeHtml(addressLine)}</div>` : '',
    line('Телефон: ', document.issuerPhone),
  ].join('');
  const columnThree = [
    document.issuerBankName ? `<div>${escapeHtml(document.issuerBankName)}</div>` : '',
    document.issuerIban ? `<div class="no-break">${escapeHtml(document.issuerIban)}</div>` : '',
    line('BIC: ', document.issuerBic),
  ].join('');
  return `<div class="issuer-block">
    <div>${columnOne}</div>
    <div>${columnTwo}</div>
    <div>${columnThree}</div>
  </div>`;
}

export function buildSignatureRow(document: Document): string {
  return `<div class="signature-row">
    <div>Съставил: ${escapeHtml(document.preparedBy ?? '')}</div>
    <div>Получател: ${escapeHtml(document.recipientMol ?? '')}</div>
  </div>`;
}
