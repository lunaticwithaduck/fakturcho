'use client';

import { pricingForLocale } from '@app/features/legal/company';
import { interpolate } from '@app/features/legal/interpolate';
import { LegalFooter } from '@app/features/legal/LegalFooter';
import { formatMoneyForLocale } from '@app/features/shared/format';
import brandIcon from '@app/features/shell/brand-icon.png';
import { Button, Card } from '@design/components';
import {
  type Locale,
  perDocumentCents,
  SUBSCRIPTION_TIER_IDS,
  SUBSCRIPTION_TIERS,
} from '@shared/types';
import Image from 'next/image';
import Link from 'next/link';
import { getMarketingContent } from './content';
import { LandingFaq } from './LandingFaq';

const tierPerDocumentCents = SUBSCRIPTION_TIER_IDS.map((id) =>
  perDocumentCents(SUBSCRIPTION_TIERS[id].priceCents, SUBSCRIPTION_TIERS[id].grantCents),
);
const sameTierPerDocument = tierPerDocumentCents.every(
  (cents) => cents === tierPerDocumentCents[0],
);

interface LandingPageProps {
  locale?: Locale;
}

export function LandingPage({ locale = 'bg' }: LandingPageProps) {
  const content = getMarketingContent(locale);
  const pricing = pricingForLocale(locale);
  const homeHref = locale === 'bg' ? '/' : '/en';
  const loginHref = locale === 'bg' ? '/login' : '/en/login';
  const signupHref = locale === 'bg' ? '/signup' : '/en/signup';

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-12 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href={homeHref} className="flex items-center gap-3">
          <Image src={brandIcon} alt="" className="h-9 w-9" priority />
          <span className="text-lg font-bold text-text">{content.brand}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link href={loginHref}>{content.nav.login}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={signupHref}>{content.nav.signup}</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-text">{content.hero.title}</h1>
          <p className="text-lg leading-relaxed text-text-muted">{content.hero.subtitle}</p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">{content.capabilities.heading}</h2>
          <ul className="flex flex-col gap-2">
            {content.capabilities.items.map((capability) => (
              <li key={capability} className="text-base leading-relaxed text-text-muted">
                {capability}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text">{content.pricing.heading}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex flex-col gap-2 p-5">
              <h3 className="text-base font-semibold text-text">
                {content.pricing.payAsYouGo.title}
              </h3>
              <p className="text-2xl font-bold text-text">{pricing.perDocument}</p>
              <p className="text-sm leading-relaxed text-text-muted">
                {interpolate(content.pricing.payAsYouGo.body, { packs: pricing.packs })}
              </p>
            </Card>
            <Card className="flex flex-col gap-2 p-5">
              <h3 className="text-base font-semibold text-text">
                {content.pricing.subscription.title}
              </h3>
              <p className="text-2xl font-bold text-text">{pricing.subscription}</p>
              <ul className="flex flex-col gap-1 text-sm leading-relaxed text-text-muted">
                {SUBSCRIPTION_TIER_IDS.map((id, index) => (
                  <li key={id}>
                    {interpolate(content.pricing.subscription.tierLine, {
                      price: formatMoneyForLocale(SUBSCRIPTION_TIERS[id].priceCents, locale),
                      credit: formatMoneyForLocale(SUBSCRIPTION_TIERS[id].grantCents, locale),
                    })}
                    {sameTierPerDocument
                      ? null
                      : interpolate(content.pricing.subscription.tierLineSuffix, {
                          perDoc: formatMoneyForLocale(tierPerDocumentCents[index] ?? 0, locale),
                        })}
                  </li>
                ))}
              </ul>
              {sameTierPerDocument ? (
                <p className="text-sm leading-relaxed text-text-muted">
                  {interpolate(content.pricing.subscription.perDocumentOnlyLine, {
                    perDoc: formatMoneyForLocale(tierPerDocumentCents[0] ?? 0, locale),
                  })}
                </p>
              ) : null}
              <p className="text-sm leading-relaxed text-text-muted">
                {content.pricing.subscription.footnote}
              </p>
            </Card>
          </div>
          <p className="text-sm text-text-muted">
            {interpolate(content.pricing.footnote, { signupGrant: pricing.signupGrant })}
          </p>
        </section>

        <LandingFaq locale={locale} />
      </main>

      <LegalFooter locale={locale} />
    </div>
  );
}
