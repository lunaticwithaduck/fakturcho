import { Button, Card } from '@design/components';
import type { CreditPackId } from '@shared/types';
import { getPackOptions } from './billingDisplay';

interface CreditPacksSectionProps {
  pendingProduct: CreditPackId | null;
  onBuy: (product: CreditPackId) => void;
}

export function CreditPacksSection({ pendingProduct, onBuy }: CreditPacksSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text">Пакети кредити</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {getPackOptions().map((pack) => (
          <Card key={pack.id} className="flex flex-col items-center gap-2 text-center">
            <p className="text-xl font-bold text-text">{pack.priceLabel}</p>
            <p className="text-sm text-text-muted">{pack.documentsLabel}</p>
            <Button size="sm" disabled={pendingProduct !== null} onClick={() => onBuy(pack.id)}>
              {pendingProduct === pack.id ? 'Зареждане...' : 'Купи'}
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
