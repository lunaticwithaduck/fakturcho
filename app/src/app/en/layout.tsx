import { getFeatureFlags } from '@app/feature-flags';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { EnglishHtmlLang } from './EnglishHtmlLang';

export default async function EnglishLayout({ children }: { children: ReactNode }) {
  const flags = await getFeatureFlags();
  if (!flags.EN_LOCALE) notFound();

  return (
    <>
      <EnglishHtmlLang />
      {children}
    </>
  );
}
