import { manifestHref } from '@app/features/pwa/buildManifest';
import { loadMessages } from '@app/i18n/locale';
import { ogLocaleAlternates, ogLocaleTag } from '@app/i18n/ogLocale';
import type { Locale } from '@shared/types';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { THEME_COLOR } from '../../theme-colors';
import { FeatureFlagsProvider, getFeatureFlags } from '../feature-flags';
import { Providers } from '../store/providers';
import { uiFont } from './fonts';
import './globals.css';

const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

const BG_METADATA: Metadata = {
  metadataBase: new URL('https://www.fakturcho.com'),
  manifest: manifestHref('bg'),
  title: {
    default: 'Фактурчо — фактури за българския бизнес',
    template: '%s — Фактурчо',
  },
  description:
    'Издавайте фактури, проформи, кредитни и дебитни известия и оферти по българските изисквания. Плащате 0,10 € на издаден документ.',
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    alternateLocale: ogLocaleAlternates('bg'),
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  if (locale === 'bg') return BG_METADATA;
  const seo = (await loadMessages(locale)).seo.home;
  return {
    ...BG_METADATA,
    title: { default: seo.title, template: '%s — Fakturcho' },
    manifest: manifestHref(locale),
    description: seo.description,
    openGraph: {
      type: 'website',
      locale: ogLocaleTag(locale),
      alternateLocale: ogLocaleAlternates(locale),
      siteName: 'Fakturcho',
    },
  };
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [flags, locale] = await Promise.all([getFeatureFlags(), getLocale()]);

  return (
    <html lang={locale} className={uiFont.variable}>
      <body className="bg-surface font-sans text-text antialiased">
        <FeatureFlagsProvider flags={flags}>
          <NextIntlClientProvider>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </FeatureFlagsProvider>
        {umamiSrc && umamiWebsiteId ? (
          <>
            <Script src={umamiSrc} data-website-id={umamiWebsiteId} strategy="afterInteractive" />
            <Script
              src={new URL('recorder.js', umamiSrc).href}
              data-website-id={umamiWebsiteId}
              strategy="afterInteractive"
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
