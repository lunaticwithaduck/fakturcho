import { describe, expect, it } from 'vitest';
import { metadata as privacyMetadata } from './privacy/page';
import { metadata as refundsMetadata } from './refunds/page';
import { metadata as termsMetadata } from './terms/page';

describe('locale legal page metadata', () => {
  it.each([
    ['privacy', privacyMetadata, 'Privacy Policy'],
    ['terms', termsMetadata, 'Terms of Service'],
    ['refunds', refundsMetadata, 'Refunds'],
  ] as const)(
    '%s title is absolute so the Bulgarian brand template never appends',
    (_doc, metadata, title) => {
      expect(metadata.title).toEqual({ absolute: title });
    },
  );

  it.each([
    ['privacy', privacyMetadata],
    ['terms', termsMetadata],
    ['refunds', refundsMetadata],
  ] as const)('%s canonicalizes to the English original for every locale', (doc, metadata) => {
    expect(metadata.alternates?.canonical).toBe(`/en/${doc}`);
    expect(metadata.alternates?.languages).toEqual({
      bg: `/${doc}`,
      en: `/en/${doc}`,
      'x-default': `/${doc}`,
    });
  });
});
