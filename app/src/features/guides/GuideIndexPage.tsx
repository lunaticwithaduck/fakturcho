import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import Link from 'next/link';
import { BackToAppLink } from './BackToAppLink';
import type { GuideContent } from './types';

interface GuideIndexPageProps {
  locale: Locale;
  heading: string;
  guides: readonly GuideContent[];
  euOverview?: GuideContent | undefined;
  euOverviewLabel: string;
  backToAppLabel: string;
}

export function GuideIndexPage({
  locale,
  heading,
  guides,
  euOverview,
  euOverviewLabel,
  backToAppLabel,
}: GuideIndexPageProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <BackToAppLink label={backToAppLabel} />
      <h1 className="text-3xl font-bold text-text">{heading}</h1>
      <ul className="flex flex-col gap-3">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={toLocalePath(`/guide/${guide.slug}`, guide.locale)}
              className="text-base text-accent underline"
            >
              {guide.h1}
            </Link>
          </li>
        ))}
        {euOverview && locale !== 'en' ? (
          <li>
            <Link
              href={toLocalePath(`/guide/${euOverview.slug}`, euOverview.locale)}
              className="text-base text-accent underline"
            >
              {euOverviewLabel}
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
