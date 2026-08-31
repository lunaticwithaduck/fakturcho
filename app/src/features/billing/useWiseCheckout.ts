'use client';

import { useCreateCheckoutMutation } from '@app/api';
import { toast } from '@design/components';
import type { CreditPackId, WiseTransferInstructionsDto } from '@shared/types';
import { useState } from 'react';

export function useWiseCheckout() {
  const [createCheckout] = useCreateCheckoutMutation();
  const [pendingProduct, setPendingProduct] = useState<CreditPackId | null>(null);
  const [instructions, setInstructions] = useState<WiseTransferInstructionsDto | null>(null);

  async function startCheckout(product: CreditPackId) {
    if (pendingProduct) return;
    setPendingProduct(product);
    try {
      const result = await createCheckout({ product }).unwrap();
      setInstructions(result);
    } catch {
      toast({
        title: 'Грешка',
        description: 'Неуспешно стартиране на плащането. Опитайте отново.',
        variant: 'danger',
      });
    } finally {
      setPendingProduct(null);
    }
  }

  return {
    startCheckout,
    pendingProduct,
    instructions,
    clearInstructions: () => setInstructions(null),
  };
}
