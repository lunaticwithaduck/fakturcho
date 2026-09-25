import { COMPANY } from '@app/features/legal/company';
import { loadMessages } from '@app/i18n/locale';
import { toLocalePath } from '@app/i18n/localeRedirect';
import type { Locale } from '@shared/types';
import type { MetadataRoute } from 'next';
import { BACKGROUND_COLOR, THEME_COLOR } from '../../../theme-colors';

const SHARED = {
  display: 'standalone',
  background_color: BACKGROUND_COLOR,
  theme_color: THEME_COLOR,
  icons: [
    {
      src: '/icon.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
} satisfies MetadataRoute.Manifest;

export const BG_MANIFEST: MetadataRoute.Manifest = {
  name: `${COMPANY.productName} — фактури за българския бизнес`,
  short_name: COMPANY.productName,
  start_url: '/',
  ...SHARED,
  lang: 'bg',
};

export async function buildManifest(locale: Locale): Promise<MetadataRoute.Manifest> {
  if (locale === 'bg') return BG_MANIFEST;
  const seo = (await loadMessages(locale)).seo.home;
  return {
    name: `Fakturcho — ${seo.ogTagline}`,
    short_name: 'Fakturcho',
    start_url: toLocalePath('/', locale),
    ...SHARED,
    lang: locale,
  };
}

export function manifestHref(locale: Locale): string {
  return locale === 'bg' ? '/manifest.webmanifest' : `/${locale}/manifest.webmanifest`;
}
