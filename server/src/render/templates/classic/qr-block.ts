import { escapeHtml } from './html-utils';

export interface KsefQrBlock {
  svg: string;
  label: string;
}

export interface VerifactuQrBlock {
  svg: string;
  legend: string | null;
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

// ES VERI*FACTU: Orden HAC/1177/2024 art. 21 places it in a visible top area
// of the invoice, 30-40mm, centred (AEAT DetalleEspecificacTecnCodigoQRfactura
// v0.5.0 §3). The literal text "QR tributario:" always precedes the code, in
// a type/size at least as large as the rest of the invoice data; the
// "VERI*FACTU" legend only when the record was actually remitted to AEAT
// (never true here — see verifactu-qr.ts).
export function buildVerifactuQrBlock(qr: VerifactuQrBlock | null | undefined): string {
  if (!qr) return '';
  return `<div class="verifactu-qr-row">
    <div class="verifactu-qr">
      <div class="qr-tributario-label">QR tributario:</div>
      <div class="qr-image">${qr.svg}</div>
      ${qr.legend ? `<div class="qr-legend">${escapeHtml(qr.legend)}</div>` : ''}
    </div>
  </div>`;
}
