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

describe('updateIssuerProfileSchema — country-driven identifier and region patterns', () => {
  it('rejects a malformed FR SIRET', () => {
    expect(() =>
      updateIssuerProfileSchema.parse({ country: 'FR', identifiers: { siret: '12' } }),
    ).toThrow();
  });

  it('accepts a well-formed FR SIRET', () => {
    expect(() =>
      updateIssuerProfileSchema.parse({ country: 'FR', identifiers: { siret: '73282932000074' } }),
    ).not.toThrow();
  });

  it('rejects a malformed IT REA identifier', () => {
    expect(() =>
      updateIssuerProfileSchema.parse({ country: 'IT', identifiers: { rea: 'MI1234567' } }),
    ).toThrow();
  });

  it('accepts a well-formed IT REA identifier', () => {
    expect(() =>
      updateIssuerProfileSchema.parse({ country: 'IT', identifiers: { rea: 'MI-1234567' } }),
    ).not.toThrow();
  });

  it('rejects a Provincia that is not two uppercase letters for an IT issuer', () => {
    expect(() =>
      updateIssuerProfileSchema.parse({ country: 'IT', countyRegion: 'Milano' }),
    ).toThrow();
  });

  it('accepts a two-letter uppercase Provincia for an IT issuer', () => {
    expect(() =>
      updateIssuerProfileSchema.parse({ country: 'IT', countyRegion: 'MI' }),
    ).not.toThrow();
  });

  it('does not enforce a pattern the country config does not define (RO countyRegion is free text)', () => {
    expect(() =>
      updateIssuerProfileSchema.parse({ country: 'RO', countyRegion: 'Cluj' }),
    ).not.toThrow();
  });

  it('skips identifier and region checks when no country is present to resolve a config from', () => {
    expect(() =>
      updateIssuerProfileSchema.parse({ identifiers: { rea: 'MI1234567' } }),
    ).not.toThrow();
  });
});
