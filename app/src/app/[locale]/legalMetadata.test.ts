import { describe, expect, it } from 'vitest';
import { generateMetadata as privacyMetadata } from './privacy/page';
import { generateMetadata as refundsMetadata } from './refunds/page';
import { generateMetadata as termsMetadata } from './terms/page';

const params = (locale: string) => ({ params: Promise.resolve({ locale }) });

describe('locale legal page metadata', () => {
  it.each([
    ['privacy', privacyMetadata, 'Privacy Policy'],
    ['terms', termsMetadata, 'Terms of Service'],
    ['refunds', refundsMetadata, 'Refunds'],
  ] as const)(
    '%s title is a plain string so the root layout brand template applies',
    async (_doc, generate, title) => {
      const metadata = await generate(params('en'));
      expect(metadata.title).toBe(title);
    },
  );

  it.each([
    ['privacy', privacyMetadata],
    ['terms', termsMetadata],
    ['refunds', refundsMetadata],
  ] as const)(
    '%s en page is self-canonical and carries the bg/en hreflang set',
    async (doc, generate) => {
      const { alternates } = await generate(params('en'));
      expect(alternates?.canonical).toBe(`/en/${doc}`);
      expect(alternates?.languages).toEqual({
        bg: `/${doc}`,
        en: `/en/${doc}`,
        'x-default': `/${doc}`,
      });
    },
  );

  it.each([
    ['privacy', privacyMetadata],
    ['terms', termsMetadata],
    ['refunds', refundsMetadata],
  ] as const)(
    '%s proxy locales canonicalize to /en and declare no hreflang of their own',
    async (doc, generate) => {
      for (const locale of ['de', 'fr', 'it', 'pl', 'ro']) {
        const { alternates } = await generate(params(locale));
        expect(alternates?.canonical).toBe(`/en/${doc}`);
        expect(alternates?.languages).toBeUndefined();
      }
    },
  );
});
