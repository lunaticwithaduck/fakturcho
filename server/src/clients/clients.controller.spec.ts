import { describe, expect, it } from 'vitest';
import { createClientSchema } from './clients.controller';

describe('createClientSchema', () => {
  it('accepts and keeps every EU/Peppol field instead of stripping it', () => {
    const body = {
      companyName: 'Acme GmbH',
      street: 'Musterstrasse 1',
      postcode: '10115',
      countyRegion: 'BE',
      country: 'DE',
      documentLanguage: 'en',
      peppolEndpointId: '0088:1234567890123',
      peppolScheme: '0088',
      sdiRecipientCode: 'ABCDEFG',
      pec: 'client@pec.it',
    };

    expect(createClientSchema.parse(body)).toMatchObject(body);
  });

  it('rejects a documentLanguage outside the supported locales', () => {
    expect(() =>
      createClientSchema.parse({ companyName: 'Acme', documentLanguage: 'xx' }),
    ).toThrow();
  });
});

describe('createClientSchema — format validation', () => {
  it('rejects a lowercase country code', () => {
    expect(() => createClientSchema.parse({ companyName: 'X', country: 'de' })).toThrow();
  });

  it('rejects a malformed Peppol scheme', () => {
    expect(() =>
      createClientSchema.parse({ companyName: 'X', peppolScheme: 'not-a-code' }),
    ).toThrow();
  });

  it('rejects a malformed SDI recipient code', () => {
    expect(() =>
      createClientSchema.parse({ companyName: 'X', sdiRecipientCode: 'too-long-code' }),
    ).toThrow();
  });

  it('rejects a malformed PEC address', () => {
    expect(() => createClientSchema.parse({ companyName: 'X', pec: 'not-an-email' })).toThrow();
  });
});

describe('createClientSchema — country-driven region pattern', () => {
  it('rejects a Provincia that is not two uppercase letters for an IT client', () => {
    expect(() =>
      createClientSchema.parse({ companyName: 'X', country: 'IT', countyRegion: 'Roma' }),
    ).toThrow();
  });

  it('accepts a two-letter uppercase Provincia for an IT client', () => {
    expect(() =>
      createClientSchema.parse({ companyName: 'X', country: 'IT', countyRegion: 'RM' }),
    ).not.toThrow();
  });

  it('does not enforce a pattern for a RO client (județ is free text)', () => {
    expect(() =>
      createClientSchema.parse({ companyName: 'X', country: 'RO', countyRegion: 'Cluj' }),
    ).not.toThrow();
  });

  it('defaults to BG when no country is given, where countyRegion has no pattern', () => {
    expect(() =>
      createClientSchema.parse({ companyName: 'X', countyRegion: 'anything' }),
    ).not.toThrow();
  });
});
