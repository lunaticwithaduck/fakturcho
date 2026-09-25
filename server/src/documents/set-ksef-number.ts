import type { DocumentDto } from '@fakturcho/shared-types';
import { DocumentStatus as PrismaDocumentStatus } from '@prisma/client';
import { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { toDocumentDto } from './document.mapper';
import { DOCUMENT_INCLUDE } from './document-include';

export async function setDocumentKsefNumber(
  prisma: PrismaService,
  accountId: string,
  documentId: string,
  ksefNumber: string | null,
): Promise<DocumentDto> {
  const existing = await prisma.document.findFirst({ where: { id: documentId, accountId } });
  if (!existing) {
    throw new DomainError('NOT_FOUND', 'Document not found.');
  }
  if (existing.status === PrismaDocumentStatus.DRAFT) {
    throw new DomainError(
      'DOCUMENT_NOT_ISSUED',
      'Only an issued document can carry a KSeF number.',
    );
  }
  if (existing.issuerCountry !== 'PL') {
    throw new DomainError('VALIDATION_FAILED', 'The KSeF number only applies to Polish invoices.');
  }

  const record = await prisma.document.update({
    where: { id: documentId },
    data: { ksefNumber },
    include: DOCUMENT_INCLUDE,
  });
  return toDocumentDto(record);
}
