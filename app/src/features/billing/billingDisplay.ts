import {
  CREDIT_PACK_IDS,
  CREDIT_PACKS,
  ISSUANCE_COST_CENTS,
  perDocumentCents,
  SUBSCRIPTION_TIER_IDS,
  SUBSCRIPTION_TIERS,
} from '@fakturcho/shared-types';
import type {
  CreditBalanceDto,
  CreditLedgerReason,
  CreditPackId,
  SubscriptionTierId,
} from '@shared/types';
import type { useTranslations } from 'next-intl';
import { formatMoney } from '../shared/format';

export type Translate = ReturnType<typeof useTranslations>;

export function getCreditLedgerReasonLabels(t: Translate): Record<CreditLedgerReason, string> {
  return {
    signup_grant: t('ledgerReasons.signupGrant'),
    purchase: t('ledgerReasons.purchase'),
    issuance: t('ledgerReasons.issuance'),
    adjustment: t('ledgerReasons.adjustment'),
    subscription_grant: t('ledgerReasons.subscriptionGrant'),
  };
}

export function balanceCaption(balance: CreditBalanceDto, t: Translate): string {
  return t('balance.remaining', { count: balance.documentsRemaining });
}

export interface PackOption {
  id: CreditPackId;
  priceLabel: string;
  documentsLabel: string;
  perDocumentLabel: string;
}

export function getPackOptions(t: Translate): PackOption[] {
  return CREDIT_PACK_IDS.map((id) => ({
    id,
    priceLabel: formatMoney(CREDIT_PACKS[id].eurCents),
    documentsLabel: t('packs.documents', {
      count: CREDIT_PACKS[id].eurCents / ISSUANCE_COST_CENTS,
    }),
    perDocumentLabel: t('perDocument', { price: formatMoney(ISSUANCE_COST_CENTS) }),
  }));
}

export interface SubscriptionTierOption {
  id: SubscriptionTierId;
  title: string;
  body: string;
  grantLabel: string;
  perDocumentLabel: string;
}

export function getSubscriptionTierOptions(t: Translate): SubscriptionTierOption[] {
  return SUBSCRIPTION_TIER_IDS.map((id) => {
    const tier = SUBSCRIPTION_TIERS[id];
    const documents = tier.grantCents / ISSUANCE_COST_CENTS;
    const grantLabel = formatMoney(tier.grantCents);
    return {
      id,
      title: t('tiers.title', { documents, price: formatMoney(tier.priceCents) }),
      body: t('tiers.body', { grant: grantLabel }),
      grantLabel,
      perDocumentLabel: t('perDocument', {
        price: formatMoney(perDocumentCents(tier.priceCents, tier.grantCents)),
      }),
    };
  });
}
