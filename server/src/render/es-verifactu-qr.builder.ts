import type { DocumentType } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { buildVerifactuQrUrl } from '../einvoice-adapters/es/verifactu-qr';
import { renderQrSvg } from './qr-svg';
import type { VerifactuQrBlock } from './templates/classic/qr-block';

// "Facturas y, en su caso, facturas rectificativas" (Orden HAC/1177/2024 art.
// 21) — not quotes, proformas or delivery notes, which aren't fiscal
// documents. `legend` stays null: see verifactu-qr.ts for why fakturcho never
// prints "VERI*FACTU".
const VERIFACTU_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note'];

export async function buildVerifactuQr(
  document: Document,
  documentType: DocumentType,
  issuerCountry: string | null,
  isDraft: boolean,
): Promise<VerifactuQrBlock | null> {
  if (issuerCountry !== 'ES' || isDraft || !VERIFACTU_DOCUMENT_TYPES.includes(documentType)) {
    return null;
  }
  if (document.issuedAt === null) return null;

  const url = buildVerifactuQrUrl({
    eik: document.issuerEik,
    vatNumber: document.issuerVatNumber,
    numberPrefix: document.numberPrefix,
    number: document.number !== null ? Number(document.number) : null,
    numberSuffix: document.numberSuffix,
    issuedAt: document.issuedAt,
    amount: document.amount,
  });
  const svg = await renderQrSvg(url);
  return { svg, legend: null };
}
