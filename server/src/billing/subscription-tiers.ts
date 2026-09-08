import type { SubscriptionTierId } from '@fakturcho/shared-types';
import { SUBSCRIPTION_TIER_IDS } from '@fakturcho/shared-types';
import { DomainError } from '../common/domain-error';

const ENV_VAR_BY_TIER: Record<SubscriptionTierId, string> = {
  sub5: 'REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID',
  sub10: 'REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID_10',
  sub25: 'REVOLUT_SUBSCRIPTION_PLAN_VARIATION_ID_25',
};

function variationIds(): Record<SubscriptionTierId, string | undefined> {
  return {
    sub5: process.env[ENV_VAR_BY_TIER.sub5],
    sub10: process.env[ENV_VAR_BY_TIER.sub10],
    sub25: process.env[ENV_VAR_BY_TIER.sub25],
  };
}

export function variationIdFor(tier: SubscriptionTierId): string {
  const id = variationIds()[tier];
  if (!id) {
    throw new DomainError(
      'CHECKOUT_NOT_CONFIGURED',
      `${ENV_VAR_BY_TIER[tier]} is not set on the api service, so the ${tier} subscription cannot be sold.`,
      { provider: ['missing_plan_variation_env', ENV_VAR_BY_TIER[tier]] },
    );
  }
  return id;
}

export function tierForVariationId(id: string | null): SubscriptionTierId | null {
  if (!id) return null;
  const ids = variationIds();
  return SUBSCRIPTION_TIER_IDS.find((tier) => ids[tier] === id) ?? null;
}
