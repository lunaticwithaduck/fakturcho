import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import Link from 'next/link';
import type { GuideContent } from './types';

interface GuideMoreGuidesProps {
  locale: Locale;
  heading: string;
  guides: readonly GuideContent[];
  euOverview?: GuideContent | undefined;
  euOverviewLabel: string;
}

export function GuideMoreGuides({
  locale,
  heading,
  guides,
  euOverview,
  euOverviewLabel,
}: GuideMoreGuidesProps) {
  const showEu = euOverview !== undefined && locale !== 'en';
  if (guides.length === 0 && !showEu) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-text">{heading}</h2>
      <ul className="flex flex-col gap-2">
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
        {showEu ? (
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
    </section>
  );
}
