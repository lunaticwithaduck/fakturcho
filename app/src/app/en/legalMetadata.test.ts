import { describe, expect, it } from 'vitest';
import { metadata as privacyMetadata } from './privacy/page';
import { metadata as refundsMetadata } from './refunds/page';
import { metadata as termsMetadata } from './terms/page';

describe('en legal page metadata', () => {
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
});
