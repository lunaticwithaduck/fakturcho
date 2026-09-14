import { getFeatureFlags } from '@app/feature-flags';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['bg_BG'],
    siteName: 'Fakturcho',
  },
};

export default async function EnglishLayout({ children }: { children: ReactNode }) {
  const flags = await getFeatureFlags();
  if (!flags.EN_LOCALE) notFound();

  return children;
}
