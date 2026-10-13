import { guideHref, guidesForLocale } from '@app/features/guides/registry';
import { getGuidesFooterLabel } from '@app/features/legal/legalContent';
import type { Locale } from '@shared/types';
import Link from 'next/link';

interface LandingGuidesProps {
  locale: Locale;
}

export function LandingGuides({ locale }: LandingGuidesProps) {
  const guides = guidesForLocale(locale);
  if (guides.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-text">{getGuidesFooterLabel(locale)}</h2>
      <ul className="flex flex-col gap-2">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link href={guideHref(guide)} className="text-base text-text-muted underline">
              {guide.h1}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
