import { buildManifest } from '@app/features/pwa/buildManifest';
import { NON_DEFAULT_PUBLISHED_LOCALES } from '@app/i18n/locale';
import type { Locale } from '@shared/types';

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(NON_DEFAULT_PUBLISHED_LOCALES as readonly string[]).includes(locale)) {
    return new Response('Not found', { status: 404 });
  }
  return Response.json(await buildManifest(locale as Locale), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
