'use client';

import {
  useGetCreditBalanceQuery,
  useGetCreditLedgerQuery,
  useGetSubscriptionQuery,
} from '@app/api';
import { Skeleton } from '@design/components';
import { BalanceCard } from './BalanceCard';
import { CreditPacksSection } from './CreditPacksSection';
import { LedgerSection } from './LedgerSection';
import { SubscriptionCard } from './SubscriptionCard';
import { useCheckoutRedirect } from './useCheckoutRedirect';

export function BillingPage() {
  const { data: balance, isLoading: isLoadingBalance } = useGetCreditBalanceQuery();
  const { data: ledger, isLoading: isLoadingLedger } = useGetCreditLedgerQuery();
  const { data: subscription, isLoading: isLoadingSubscription } = useGetSubscriptionQuery();
  const { startCheckout, pendingProduct } = useCheckoutRedirect();

  const isLoading = isLoadingBalance || isLoadingLedger || isLoadingSubscription;

  if (isLoading || !balance || !ledger) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-text">Билинг</h1>
      <BalanceCard balance={balance} />
      <CreditPacksSection pendingProduct={pendingProduct} onBuy={startCheckout} />
      <SubscriptionCard
        subscription={subscription ?? null}
        pendingProduct={pendingProduct}
        onSubscribe={() => startCheckout('subscription')}
      />
      <LedgerSection entries={ledger} />
    </div>
  );
}
