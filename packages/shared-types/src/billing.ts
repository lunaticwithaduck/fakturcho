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

export type CheckoutProduct = CreditPackId | 'subscription';

export interface CheckoutRequest {
  product: CheckoutProduct;
}

export interface CreditBalanceDto {
  balanceCents: number;
  documentsRemaining: number;
  hasUnlimitedSubscription: boolean;
}

export const CREDIT_LEDGER_REASONS = [
  'signup_grant',
  'purchase',
  'issuance',
  'adjustment',
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
  currentPeriodEnd: string | null;
}

export interface CheckoutSessionDto {
  checkoutUrl: string;
}
