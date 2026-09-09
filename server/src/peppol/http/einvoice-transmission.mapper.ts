import type { EinvoiceTransmission } from '@prisma/client';

export interface EinvoiceTransmissionDto {
  documentId: string;
  status: EinvoiceTransmission['status'];
  provider: string;
  providerMessageId: string | null;
  receipt: string | null;
  errorText: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toEinvoiceTransmissionDto(record: EinvoiceTransmission): EinvoiceTransmissionDto {
  return {
    documentId: record.documentId,
    status: record.status,
    provider: record.provider,
    providerMessageId: record.providerMessageId,
    receipt: record.receipt,
    errorText: record.errorText,
    retryCount: record.retryCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
