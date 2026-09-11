import { describe, expect, it } from 'vitest';
import { updateIssuerProfileSchema } from './issuer.controller';

describe('updateIssuerProfileSchema', () => {
  it('accepts and keeps every EU/Peppol field instead of stripping it', () => {
    const body = {
      companyName: 'Acme GmbH',
      street: 'Musterstrasse 1',
      postcode: '10115',
      countyRegion: 'BE',
      country: 'DE',
      peppolEndpointId: '0088:1234567890123',
      peppolScheme: '0088',
    };

    expect(updateIssuerProfileSchema.parse(body)).toMatchObject(body);
  });
});

describe('updateIssuerProfileSchema — format validation', () => {
  it('rejects a lowercase country code', () => {
    expect(() => updateIssuerProfileSchema.parse({ country: 'de' })).toThrow();
  });

  it('rejects a malformed Peppol scheme', () => {
    expect(() => updateIssuerProfileSchema.parse({ peppolScheme: 'not-a-code' })).toThrow();
  });
});
