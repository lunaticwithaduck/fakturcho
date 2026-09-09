import {
  perDocumentCents,
  SUBSCRIPTION_TIER_IDS,
  SUBSCRIPTION_TIERS,
} from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { formatMoneyForLocale } from '../shared/format';
import { getLandingFaq } from './landingFaq';

describe.each(['bg', 'en'] as const)('LANDING_FAQ pricing answer (%s)', (locale) => {
  it('states the subscription per-document price matching the tier constants', () => {
    const tierPerDocumentCents = SUBSCRIPTION_TIER_IDS.map((id) =>
      perDocumentCents(SUBSCRIPTION_TIERS[id].priceCents, SUBSCRIPTION_TIERS[id].grantCents),
    );
    expect(new Set(tierPerDocumentCents).size).toBe(1);

    const question = locale === 'bg' ? 'Колко струва?' : 'How much does it cost?';
    const answer = getLandingFaq(locale).find((item) => item.question === question)?.answer ?? '';
    const perDoc = formatMoneyForLocale(tierPerDocumentCents[0] ?? 0, locale);
    const expectedFragment =
      locale === 'bg' ? `с абонамент документът излиза ${perDoc}` : `a document costs ${perDoc}`;
    expect(answer).toContain(expectedFragment);
  });
});
