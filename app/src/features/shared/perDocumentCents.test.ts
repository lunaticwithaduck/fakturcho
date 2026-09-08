import {
  CREDIT_PACKS,
  ISSUANCE_COST_CENTS,
  perDocumentCents,
  SUBSCRIPTION_TIERS,
} from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('perDocumentCents', () => {
  it('returns the issuance cost for every credit pack', () => {
    for (const pack of Object.values(CREDIT_PACKS)) {
      expect(perDocumentCents(pack.eurCents, pack.eurCents)).toBe(ISSUANCE_COST_CENTS);
    }
  });

  it('returns 5 cents for every subscription tier', () => {
    for (const tier of Object.values(SUBSCRIPTION_TIERS)) {
      expect(perDocumentCents(tier.priceCents, tier.grantCents)).toBe(5);
    }
  });

  it('rounds half up', () => {
    expect(perDocumentCents(5, 20)).toBe(3);
    expect(perDocumentCents(3, 20)).toBe(2);
  });
});
