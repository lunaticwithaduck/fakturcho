import type { Metadata } from 'next';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { FeatureFlagsProvider, getFeatureFlags } from '../feature-flags';
import { LocaleProvider } from '../i18n/LocaleProvider';
import { Providers } from '../store/providers';
import { uiFont } from './fonts';
import './globals.css';

const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export const metadata: Metadata = {
  metadataBase: new URL('https://www.fakturcho.com'),
  title: {
    default: 'Фактурчо — фактури за българския бизнес',
    template: '%s — Фактурчо',
  },
  description:
    'Издавайте фактури, проформи, кредитни и дебитни известия и оферти по българските изисквания. Плащате 0,10 € на издаден документ.',
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    alternateLocale: ['en_US'],
    siteName: 'Фактурчо',
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: './',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const flags = await getFeatureFlags();

  return (
    <html lang="bg" className={uiFont.variable}>
      <body className="bg-surface font-sans text-text antialiased">
        <FeatureFlagsProvider flags={flags}>
          <NextIntlClientProvider>
            <LocaleProvider>
              <Providers>{children}</Providers>
            </LocaleProvider>
          </NextIntlClientProvider>
        </FeatureFlagsProvider>
        {umamiSrc && umamiWebsiteId ? (
          <Script src={umamiSrc} data-website-id={umamiWebsiteId} strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
