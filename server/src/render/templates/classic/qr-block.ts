import { escapeHtml } from './html-utils';

export interface KsefQrBlock {
  svg: string;
  label: string;
}

// PL KOD I: sits near the issuer footer, the KSeF number always
// printed under it.
export function buildKsefQrBlock(qr: KsefQrBlock | null | undefined): string {
  if (!qr) return '';
  return `<div class="ksef-qr">
    <div class="qr-image">${qr.svg}</div>
    <div class="qr-label">${escapeHtml(qr.label)}</div>
  </div>`;
}
