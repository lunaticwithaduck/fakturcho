'use client';

import { useGetCreditBalanceQuery, useGetCreditLedgerQuery } from '@app/api';
import { Skeleton } from '@design/components';
import { BalanceCard } from './BalanceCard';
import { CreditPacksSection } from './CreditPacksSection';
import { LedgerSection } from './LedgerSection';
import { useWiseCheckout } from './useWiseCheckout';
import { WiseTransferDialog } from './WiseTransferDialog';

export function BillingPage() {
  const { data: balance, isLoading: isLoadingBalance } = useGetCreditBalanceQuery();
  const { data: ledger, isLoading: isLoadingLedger } = useGetCreditLedgerQuery();
  const { startCheckout, pendingProduct, instructions, clearInstructions } = useWiseCheckout();

  const isLoading = isLoadingBalance || isLoadingLedger;

  if (isLoading || !balance || !ledger) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-text">Билинг</h1>
      <BalanceCard balance={balance} />
      <CreditPacksSection pendingProduct={pendingProduct} onBuy={startCheckout} />
      <LedgerSection entries={ledger} />
      {instructions ? (
        <WiseTransferDialog
          instructions={instructions}
          onOpenChange={(open) => {
            if (!open) clearInstructions();
          }}
        />
      ) : null}
    </div>
  );
}
