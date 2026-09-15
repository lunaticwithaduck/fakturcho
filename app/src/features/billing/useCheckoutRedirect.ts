'use client';

import { useCreateCheckoutMutation } from '@app/api';
import { toast } from '@design/components';
import type { CheckoutProduct } from '@shared/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function useCheckoutRedirect() {
  const t = useTranslations('billing');
  const [createCheckout] = useCreateCheckoutMutation();
  const [pendingProduct, setPendingProduct] = useState<CheckoutProduct | null>(null);

  async function startCheckout(product: CheckoutProduct) {
    if (pendingProduct) return;
    setPendingProduct(product);
    try {
      const result = await createCheckout({ product }).unwrap();
      window.location.href = result.checkoutUrl;
    } catch {
      setPendingProduct(null);
      toast({
        title: t('checkoutError.title'),
        description: t('checkoutError.description'),
        variant: 'danger',
      });
    }
  }

  return { startCheckout, pendingProduct };
}
