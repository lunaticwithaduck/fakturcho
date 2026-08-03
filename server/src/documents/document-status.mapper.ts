import type { DocumentStatus, StoredDocumentStatus } from '@fakturcho/shared-types';
import { DocumentStatus as PrismaDocumentStatus } from '@prisma/client';

const TO_STORED: Record<PrismaDocumentStatus, StoredDocumentStatus> = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

const TO_PRISMA: Record<StoredDocumentStatus, PrismaDocumentStatus> = {
  draft: PrismaDocumentStatus.DRAFT,
  sent: PrismaDocumentStatus.SENT,
  paid: PrismaDocumentStatus.PAID,
  cancelled: PrismaDocumentStatus.CANCELLED,
};

export function fromPrismaStatus(status: PrismaDocumentStatus): StoredDocumentStatus {
  return TO_STORED[status];
}

export function toPrismaStatus(status: StoredDocumentStatus): PrismaDocumentStatus {
  return TO_PRISMA[status];
}

export function toDisplayStatus(
  status: PrismaDocumentStatus,
  dueAt: Date | null,
  today: Date,
): DocumentStatus {
  const stored = fromPrismaStatus(status);
  if (stored === 'sent' && dueAt !== null && isPastDue(dueAt, today)) {
    return 'overdue';
  }
  return stored;
}

function isPastDue(dueAt: Date, today: Date): boolean {
  const due = Date.UTC(dueAt.getUTCFullYear(), dueAt.getUTCMonth(), dueAt.getUTCDate());
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return due < now;
}
