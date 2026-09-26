import type { DocumentType } from '@fakturcho/shared-types';
import type { PrismaClient } from '@prisma/client';
import { resolveOriginalKsefNumber } from '../documents/document.mapper';
import type { OriginalDocumentRef } from './templates/classic/correction-reference';

// Correction-only lookup, kept narrow (unlike DOCUMENT_INCLUDE's full eager
// load) since the render path only ever needs the correction-reference line
// and the PL art. 108a ust. 1a corrected-total check (mentions/pl.ts).
export async function resolveOriginalDocumentRef(
  prisma: PrismaClient,
  accountId: string,
  originalDocumentId: string | null,
  documentType: DocumentType,
): Promise<OriginalDocumentRef | null> {
  const isCorrection = documentType === 'credit_note' || documentType === 'debit_note';
  if (!isCorrection || !originalDocumentId) return null;
  const original = await prisma.document.findFirst({
    where: { id: originalDocumentId, accountId },
    select: {
      number: true,
      numberPrefix: true,
      numberSuffix: true,
      issuedAt: true,
      ksefNumber: true,
      einvoiceTransmission: true,
      amount: true,
    },
  });
  if (!original) return null;
  return {
    number: original.number,
    numberPrefix: original.numberPrefix,
    numberSuffix: original.numberSuffix,
    issuedAt: original.issuedAt,
    ksefNumber: resolveOriginalKsefNumber(original),
    amount: original.amount,
  };
}
