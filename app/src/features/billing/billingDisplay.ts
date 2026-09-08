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
import { formatMoney } from '../shared/format';

export const CREDIT_LEDGER_REASON_LABELS: Record<CreditLedgerReason, string> = {
  signup_grant: 'Начален бонус',
  purchase: 'Покупка на кредити',
  issuance: 'Издаден документ',
  adjustment: 'Корекция',
  subscription_grant: 'Зареждане от абонамент',
};

export function balanceCaption(balance: CreditBalanceDto): string {
  if (balance.documentsRemaining === 1) return 'още 1 документ';
  return `още ${balance.documentsRemaining} документа`;
}

export interface PackOption {
  id: CreditPackId;
  priceLabel: string;
  documentsLabel: string;
  perDocumentLabel: string;
}

export function getPackOptions(): PackOption[] {
  return CREDIT_PACK_IDS.map((id) => ({
    id,
    priceLabel: formatMoney(CREDIT_PACKS[id].eurCents),
    documentsLabel: `${CREDIT_PACKS[id].eurCents / ISSUANCE_COST_CENTS} документа`,
    perDocumentLabel: `${formatMoney(ISSUANCE_COST_CENTS)} на документ`,
  }));
}

export interface SubscriptionTierOption {
  id: SubscriptionTierId;
  title: string;
  body: string;
  grantLabel: string;
  perDocumentLabel: string;
}

export function getSubscriptionTierOptions(): SubscriptionTierOption[] {
  return SUBSCRIPTION_TIER_IDS.map((id) => {
    const tier = SUBSCRIPTION_TIERS[id];
    const documents = tier.grantCents / ISSUANCE_COST_CENTS;
    const grantLabel = formatMoney(tier.grantCents);
    return {
      id,
      title: `${documents} документа на месец за ${formatMoney(tier.priceCents)}`,
      body: `Зарежда ${grantLabel} кредит всеки месец; неизползваният кредит се запазва.`,
      grantLabel,
      perDocumentLabel: `${formatMoney(perDocumentCents(tier.priceCents, tier.grantCents))} на документ`,
    };
  });
}
