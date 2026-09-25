import { interpolate } from '@app/features/legal/interpolate';
import { LegalFooter } from '@app/features/legal/LegalFooter';
import { formatDateForLocale } from '@app/features/shared/format';
import { GuideBreadcrumb } from './GuideBreadcrumb';
import { GuideCta } from './GuideCta';
import { GuideFaq } from './GuideFaq';
import { GuideSections } from './GuideSections';
import { GuideToc } from './GuideToc';
import { buildGuideJsonLd } from './jsonLd';
import type { GuideContent } from './types';

export interface GuidePageChrome {
  homeLabel: string;
  guidesLabel: string;
  tocLabel: string;
  lastReviewedLabel: string;
  signupLabel: string;
  brand: string;
}

interface GuidePageProps {
  guide: GuideContent;
  chrome: GuidePageChrome;
}

export function GuidePage({ guide, chrome }: GuidePageProps) {
  const locale = guide.locale;
  const lastReviewedText = interpolate(chrome.lastReviewedLabel, {
    date: formatDateForLocale(guide.lastReviewed, locale),
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <script type="application/ld+json">
        {buildGuideJsonLd(guide, { homeLabel: chrome.homeLabel, guidesLabel: chrome.guidesLabel })}
      </script>
      <GuideBreadcrumb
        locale={locale}
        homeLabel={chrome.homeLabel}
        guidesLabel={chrome.guidesLabel}
        title={guide.h1}
      />
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-text">{guide.h1}</h1>
        <p className="text-lg leading-relaxed text-text-muted">{guide.answer}</p>
        <p className="text-sm text-text-subtle">{lastReviewedText}</p>
      </header>
      <GuideToc sections={guide.sections} label={chrome.tocLabel} />
      <article className="flex flex-col gap-8">
        <GuideSections sections={guide.sections} />
      </article>
      <GuideFaq heading={guide.faqHeading} entries={guide.faq} />
      <GuideCta
        cta={guide.cta}
        locale={locale}
        signupLabel={chrome.signupLabel}
        brand={chrome.brand}
      />
      <LegalFooter locale={locale} entity={locale === 'bg'} />
    </div>
  );
}
