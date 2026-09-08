import { formatDate } from '@app/features/shared/format';
import { Button, Card } from '@design/components';
import type { CheckoutProduct, SubscriptionDto } from '@shared/types';
import { SUBSCRIPTION_STATUS_LABELS } from './subscriptionStatus';

interface SubscriptionCardProps {
  subscription: SubscriptionDto | null;
  pendingProduct: CheckoutProduct | null;
  onSubscribe: () => void;
}

export function SubscriptionCard({
  subscription,
  pendingProduct,
  onSubscribe,
}: SubscriptionCardProps) {
  if (subscription) {
    return (
      <Card className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-muted">Абонамент</p>
        <p className="text-lg font-semibold text-text">
          {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
        </p>
        {subscription.currentPeriodEnd ? (
          <>
            <p className="text-sm text-text-muted">
              Текущият период изтича на {formatDate(subscription.currentPeriodEnd)}
            </p>
            <p className="text-sm text-text-muted">Следващото зареждане: 10 € кредит</p>
          </>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-start gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-text">100 документа на месец за 5 €</p>
        <p className="text-sm text-text-muted">
          Абонаментът зарежда 10 € кредит на всеки 30 дни — двойно спрямо пакетите. Неизползваният
          кредит се запазва.
        </p>
      </div>
      <Button disabled={pendingProduct !== null} onClick={onSubscribe}>
        {pendingProduct === 'subscription' ? 'Пренасочване...' : 'Активирай абонамент'}
      </Button>
    </Card>
  );
}
