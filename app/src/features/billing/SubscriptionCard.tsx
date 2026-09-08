import { formatDate } from '@app/features/shared/format';
import { Button, Card } from '@design/components';
import type { CheckoutProduct, SubscriptionDto, SubscriptionTierId } from '@shared/types';
import { getSubscriptionTierOptions } from './billingDisplay';
import { SubscriptionTierOption } from './SubscriptionTierOption';
import { isSubscriptionUsable, SUBSCRIPTION_STATUS_LABELS } from './subscriptionStatus';

interface SubscriptionCardProps {
  subscription: SubscriptionDto | null;
  pendingProduct: CheckoutProduct | null;
  onSelectTier: (tier: SubscriptionTierId) => void;
}

export function SubscriptionCard({
  subscription,
  pendingProduct,
  onSelectTier,
}: SubscriptionCardProps) {
  const tierOptions = getSubscriptionTierOptions();

  if (subscription && isSubscriptionUsable(subscription.status) && subscription.tier) {
    const active = tierOptions.find((option) => option.id === subscription.tier);
    const otherTiers = tierOptions.filter((option) => option.id !== subscription.tier);
    return (
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-text-muted">Абонамент</p>
          <p className="text-lg font-semibold text-text">{active?.title ?? 'Активен'}</p>
          {subscription.currentPeriodEnd ? (
            <p className="text-sm text-text-muted">
              Текущият период изтича на {formatDate(subscription.currentPeriodEnd)}
            </p>
          ) : null}
          {active ? (
            <p className="text-sm text-text-muted">
              Следващото зареждане: {active.grantLabel} кредит
            </p>
          ) : null}
        </div>
        {otherTiers.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text-muted">Смени на</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {otherTiers.map((option) => (
                <SubscriptionTierOption
                  key={option.id}
                  option={option}
                  buttonLabel="Смени"
                  pending={pendingProduct === option.id}
                  disabled={pendingProduct !== null}
                  onSelect={() => onSelectTier(option.id)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    );
  }

  const pendingTier = subscription && subscription.status === 'trialing' ? subscription.tier : null;

  return (
    <Card className="flex flex-col items-start gap-3">
      {subscription ? (
        <div className="flex w-full flex-col gap-2">
          <p className="text-sm font-medium text-text-muted">
            Абонамент: {SUBSCRIPTION_STATUS_LABELS[subscription.status]}
          </p>
          {pendingTier ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={pendingProduct !== null}
              onClick={() => onSelectTier(pendingTier)}
            >
              {pendingProduct === pendingTier ? 'Пренасочване...' : 'Продължи към плащане'}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {tierOptions.map((option) => (
          <SubscriptionTierOption
            key={option.id}
            option={option}
            buttonLabel="Активирай"
            pending={pendingProduct === option.id}
            disabled={pendingProduct !== null}
            onSelect={() => onSelectTier(option.id)}
          />
        ))}
      </div>
    </Card>
  );
}
