import type { DocumentType } from '@fakturcho/shared-types';
import type { Document } from '@prisma/client';
import { toDocumentDto } from '../documents/document.mapper';
import { DOCUMENT_INCLUDE } from '../documents/document-include';
import { toFa3Xml } from '../einvoice-adapters/pl/fa3-mapper';
import { checkFa3Readiness } from '../einvoice-adapters/pl/fa3-readiness';
import { buildKodIUrl } from '../einvoice-adapters/pl/ksef-qr';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { renderQrSvg } from './qr-svg';
import type { KsefQrBlock } from './templates/classic/qr-block';

const FA3_DOCUMENT_TYPES: readonly DocumentType[] = ['invoice', 'credit_note', 'debit_note'];

// Rebuilds the exact DocumentDto the /einvoice/xml endpoint would export
// (same DOCUMENT_INCLUDE + toDocumentDto + toFa3Xml chain) so the QR's hash
// always matches the XML file the user actually uploads to KSeF.
export async function buildKsefQr(
  prisma: PrismaService,
  accountId: string,
  document: Document,
  documentType: DocumentType,
  issuerCountry: string | null,
  isDraft: boolean,
): Promise<KsefQrBlock | null> {
  if (issuerCountry !== 'PL' || isDraft || !FA3_DOCUMENT_TYPES.includes(documentType)) {
    return null;
  }
  // Art. 106gb ustawy o VAT: KOD I verifies an invoice already in KSeF; one issued
  // outside KSeF also needs KOD II, which requires an MF offline certificate.
  if (!document.ksefNumber?.trim()) return null;

  const record = await prisma.document.findFirst({
    where: { id: document.id, accountId },
    include: DOCUMENT_INCLUDE,
  });
  if (!record) return null;

  const dto = toDocumentDto(record);
  if (!checkFa3Readiness(dto).ready) return null;

  const xml = toFa3Xml(dto);
  const svg = await renderQrSvg(buildKodIUrl(dto, xml));
  return { svg, label: document.ksefNumber.trim() };
}
