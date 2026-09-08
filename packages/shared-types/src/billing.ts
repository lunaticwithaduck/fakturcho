import type { SubscriptionStatus } from './enums';

export const ISSUANCE_COST_CENTS = 10;
export const SIGNUP_GRANT_CENTS = 100;

export const CREDIT_PACK_IDS = ['pack5', 'pack10', 'pack25'] as const;
export type CreditPackId = (typeof CREDIT_PACK_IDS)[number];

export const CREDIT_PACKS: Record<CreditPackId, { eurCents: number }> = {
  pack5: { eurCents: 500 },
  pack10: { eurCents: 1000 },
  pack25: { eurCents: 2500 },
};

export const SUBSCRIPTION_TIER_IDS = ['sub5', 'sub10', 'sub25'] as const;
export type SubscriptionTierId = (typeof SUBSCRIPTION_TIER_IDS)[number];

export const SUBSCRIPTION_TIERS: Record<
  SubscriptionTierId,
  { priceCents: number; grantCents: number }
> = {
  sub5: { priceCents: 500, grantCents: 1000 },
  sub10: { priceCents: 1000, grantCents: 2000 },
  sub25: { priceCents: 2500, grantCents: 5000 },
};

export type CheckoutProduct = CreditPackId | SubscriptionTierId;

export interface CheckoutRequest {
  product: CheckoutProduct;
}

export interface CreditBalanceDto {
  balanceCents: number;
  documentsRemaining: number;
}

export const CREDIT_LEDGER_REASONS = [
  'signup_grant',
  'purchase',
  'issuance',
  'adjustment',
  'subscription_grant',
] as const;
export type CreditLedgerReason = (typeof CREDIT_LEDGER_REASONS)[number];

export interface CreditLedgerEntryDto {
  id: string;
  amountCents: number;
  reason: CreditLedgerReason;
  documentId: string | null;
  createdAt: string;
}

export interface SubscriptionDto {
  id: string;
  status: SubscriptionStatus;
  planId: string | null;
  tier: SubscriptionTierId | null;
  currentPeriodEnd: string | null;
}

export interface CheckoutSessionDto {
  checkoutUrl: string;
}
