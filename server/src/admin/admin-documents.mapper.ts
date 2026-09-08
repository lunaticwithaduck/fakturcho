import type { AdminDocumentSummary, CurrencyCode } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import type { Document, IssuerProfile } from '@prisma/client';
import { toDisplayStatus } from '../documents/document-status.mapper';
import { fromPrismaDocumentType } from '../numbering/document-type.mapper';
import { accountDisplayName } from './account-display.util';

export interface AdminDocumentRow extends Document {
  account: { issuerProfile: IssuerProfile | null; users: { email: string }[] };
}

function formatAdminDocumentNumber(row: AdminDocumentRow): string {
  if (row.number === null) return 'Чернова';
  return `${row.numberPrefix ?? ''}${formatDocumentNumber(Number(row.number))}${row.numberSuffix ?? ''}`;
}

export function toAdminDocumentSummary(
  row: AdminDocumentRow,
  today: Date = new Date(),
): AdminDocumentSummary {
  return {
    id: row.id,
    accountId: row.accountId,
    accountName: accountDisplayName(row.account.issuerProfile, row.account.users),
    documentType: fromPrismaDocumentType(row.documentType),
    status: toDisplayStatus(row.status, row.dueAt, today),
    number: formatAdminDocumentNumber(row),
    recipientCompanyName: row.recipientCompanyName ?? '',
    amount: row.amount,
    currency: row.currency as CurrencyCode,
    issuedAt: row.issuedAt ? row.issuedAt.toISOString().slice(0, 10) : null,
  };
}
