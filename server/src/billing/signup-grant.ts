import { SIGNUP_GRANT_CENTS } from '@fakturcho/shared-types';
import type { Prisma } from '@prisma/client';
import { CreditLedgerReason } from '@prisma/client';

export async function grantSignupCredits(
  tx: Prisma.TransactionClient,
  accountId: string,
): Promise<void> {
  await tx.account.update({
    where: { id: accountId },
    data: { creditBalanceCents: { increment: SIGNUP_GRANT_CENTS } },
  });
  await tx.creditLedgerEntry.create({
    data: { accountId, amountCents: SIGNUP_GRANT_CENTS, reason: CreditLedgerReason.SIGNUP_GRANT },
  });
}
