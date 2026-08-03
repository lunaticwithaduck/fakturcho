'use client';

import { Button, Card, Skeleton, toast } from '@design/components';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useCreateCheckoutMutation, useGetSubscriptionQuery } from '../api';
import { isSubscriptionUsable } from './subscriptionStatus';

export function RequireSubscription({ children }: { children: ReactNode }) {
  const { data, isLoading } = useGetSubscriptionQuery();
  const [createCheckout] = useCreateCheckoutMutation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (data && isSubscriptionUsable(data.status)) {
    return <>{children}</>;
  }

  async function handleCheckout() {
    setIsRedirecting(true);
    try {
      const result = await createCheckout().unwrap();
      window.location.href = result.checkoutUrl;
    } catch {
      setIsRedirecting(false);
      toast({
        title: 'Грешка при пренасочване',
        description: 'Неуспешно стартиране на плащането. Опитайте отново.',
        variant: 'danger',
      });
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold text-text">Нужен е активен абонамент</h1>
        <p className="text-sm text-text-muted">
          Пробният ви период е изтекъл или абонаментът не е активен. Активирайте абонамент, за да
          продължите да използвате Фактурчо.
        </p>
        <Button onClick={handleCheckout} disabled={isRedirecting}>
          {isRedirecting ? 'Пренасочване...' : 'Активирай абонамент'}
        </Button>
      </Card>
    </div>
  );
}
