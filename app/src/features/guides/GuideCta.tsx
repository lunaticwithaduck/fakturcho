'use client';

import { toLocalePath } from '@app/i18n/localeRedirect';
import { Button } from '@design/components';
import type { Locale } from '@shared/types';
import Link from 'next/link';
import { renderInline } from './renderInline';
import type { GuideCta as GuideCtaContent } from './types';

interface GuideCtaProps {
  cta: GuideCtaContent;
  locale: Locale;
  signupLabel: string;
  brand: string;
}

export function GuideCta({ cta, locale, signupLabel, brand }: GuideCtaProps) {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-surface-raised p-5">
      <h2 className="text-xl font-semibold text-text">{cta.heading}</h2>
      <p className="text-base leading-relaxed text-text-muted">{renderInline(cta.body)}</p>
      <div className="flex flex-wrap items-center gap-4">
        <Button asChild>
          <Link href={toLocalePath('/signup', locale)}>{signupLabel}</Link>
        </Button>
        <Link href={toLocalePath('/', locale)} className="text-sm text-text-muted underline">
          {brand}
        </Link>
      </div>
    </section>
  );
}
