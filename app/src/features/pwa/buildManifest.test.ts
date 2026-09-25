import { PUBLISHED_LOCALES } from '@shared/types';
import { describe, expect, it } from 'vitest';
import { BG_MANIFEST, buildManifest, manifestHref } from './buildManifest';

describe('buildManifest', () => {
  it('keeps the Bulgarian manifest for bg', async () => {
    const manifest = await buildManifest('bg');
    expect(manifest).toBe(BG_MANIFEST);
    expect(manifest.name).toBe('Фактурчо — фактури за българския бизнес');
    expect(manifest.start_url).toBe('/');
  });

  it.each(PUBLISHED_LOCALES.filter((locale) => locale !== 'bg'))(
    'gives %s a Latin-script manifest that starts on its own home',
    async (locale) => {
      const manifest = await buildManifest(locale);
      expect(manifest.short_name).toBe('Fakturcho');
      expect(manifest.lang).toBe(locale);
      expect(manifest.start_url).toBe(`/${locale}`);
      expect(JSON.stringify(manifest)).not.toMatch(/[Ѐ-ӿ]/);
    },
  );

  it('links bg to the root manifest and other locales to their own', () => {
    expect(manifestHref('bg')).toBe('/manifest.webmanifest');
    expect(manifestHref('de')).toBe('/de/manifest.webmanifest');
  });
});
