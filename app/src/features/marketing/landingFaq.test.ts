import {
  perDocumentCents,
  SUBSCRIPTION_TIER_IDS,
  SUBSCRIPTION_TIERS,
} from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { formatMoney } from '../shared/format';
import { LANDING_FAQ } from './landingFaq';

describe('LANDING_FAQ pricing answer', () => {
  it('states the subscription per-document price matching the tier constants', () => {
    const tierPerDocumentCents = SUBSCRIPTION_TIER_IDS.map((id) =>
      perDocumentCents(SUBSCRIPTION_TIERS[id].priceCents, SUBSCRIPTION_TIERS[id].grantCents),
    );
    expect(new Set(tierPerDocumentCents).size).toBe(1);

    const answer = LANDING_FAQ.find((item) => item.question === 'Колко струва?')?.answer ?? '';
    expect(answer).toContain(
      `с абонамент документът излиза ${formatMoney(tierPerDocumentCents[0] ?? 0)}`,
    );
  });
});
