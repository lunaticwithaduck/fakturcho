import { loadMessages } from '@app/i18n/locale';
import { renderOgImage } from '@og/build-og-image';
import type { Locale } from '@shared/types';

export const runtime = 'nodejs';
// Static per Next.js's file convention (no access to route params); en's
// title is the only published one today, so this stays byte-identical to
// what it replaces.
export const alt = 'Fakturcho — invoicing and e-invoicing for EU businesses';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { seo } = await loadMessages(locale as Locale);
  return renderOgImage({ brand: 'Fakturcho', tagline: seo.home.ogTagline as string });
}
