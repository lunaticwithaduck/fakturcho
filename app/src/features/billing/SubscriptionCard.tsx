import { formatDate } from '@app/features/shared/format';
import { Button, Card } from '@design/components';
import type { CheckoutProduct, SubscriptionDto, SubscriptionTierId } from '@shared/types';
import { useTranslations } from 'next-intl';
import { getSubscriptionTierOptions } from './billingDisplay';
import { SubscriptionTierOption } from './SubscriptionTierOption';
import { getSubscriptionStatusLabels, isSubscriptionUsable } from './subscriptionStatus';

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
  const t = useTranslations('billing');
  const tierOptions = getSubscriptionTierOptions(t);

  if (subscription && isSubscriptionUsable(subscription.status) && subscription.tier) {
    const active = tierOptions.find((option) => option.id === subscription.tier);
    const pendingUpgradeTier = subscription.pendingUpgrade?.tier
      ? tierOptions.find((option) => option.id === subscription.pendingUpgrade?.tier)
      : null;
    const otherTiers = tierOptions.filter(
      (option) => option.id !== subscription.tier && option.id !== pendingUpgradeTier?.id,
    );
    return (
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-text-muted">{t('subscription.label')}</p>
          <p className="text-lg font-semibold text-text">
            {active?.title ?? t('subscriptionStatus.active')}
          </p>
          {subscription.currentPeriodEnd ? (
            <p className="text-sm text-text-muted">
              {t('subscription.periodEnds', { date: formatDate(subscription.currentPeriodEnd) })}
            </p>
          ) : null}
          {active ? (
            <p className="text-sm text-text-muted">
              {t('subscription.nextGrant', { grant: active.grantLabel })}
            </p>
          ) : null}
          {active ? <p className="text-xs text-text-muted">{active.perDocumentLabel}</p> : null}
        </div>
        {pendingUpgradeTier ? (
          <div className="flex flex-col items-start gap-2 border-t border-border pt-3">
            <p className="text-sm text-text-muted">
              {t('subscription.pendingUpgrade', { title: pendingUpgradeTier.title })}
            </p>
            <Button
              size="sm"
              disabled={pendingProduct !== null}
              onClick={() => onSelectTier(pendingUpgradeTier.id)}
            >
              {pendingProduct === pendingUpgradeTier.id
                ? t('actions.redirecting')
                : t('actions.continueToPayment')}
            </Button>
          </div>
        ) : null}
        {otherTiers.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text-muted">{t('subscription.switchTo')}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {otherTiers.map((option) => (
                <SubscriptionTierOption
                  key={option.id}
                  option={option}
                  buttonLabel={t('actions.switch')}
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
            {t('subscription.statusLine', {
              status: getSubscriptionStatusLabels(t)[subscription.status],
            })}
          </p>
          {pendingTier ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={pendingProduct !== null}
              onClick={() => onSelectTier(pendingTier)}
            >
              {pendingProduct === pendingTier
                ? t('actions.redirecting')
                : t('actions.continueToPayment')}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {tierOptions.map((option) => (
          <SubscriptionTierOption
            key={option.id}
            option={option}
            buttonLabel={t('actions.activate')}
            pending={pendingProduct === option.id}
            disabled={pendingProduct !== null}
            onSelect={() => onSelectTier(option.id)}
          />
        ))}
      </div>
    </Card>
  );
}
