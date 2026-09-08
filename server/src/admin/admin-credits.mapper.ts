import type { CreditPurchaseRow } from '@fakturcho/shared-types';
import type { CreditLedgerEntry, IssuerProfile } from '@prisma/client';
import { accountDisplayName } from './account-display.util';

export interface CreditPurchaseRowSource extends CreditLedgerEntry {
  account: { issuerProfile: IssuerProfile | null; users: { email: string }[] };
}

export function toCreditPurchaseRow(row: CreditPurchaseRowSource): CreditPurchaseRow {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    accountId: row.accountId,
    accountName: accountDisplayName(row.account.issuerProfile, row.account.users),
    amountCents: row.amountCents,
    revolutOrderId: row.revolutOrderId,
  };
}
