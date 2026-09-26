import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildIssuerBlock — generic EU country (e.g. CZ) company register', () => {
  const locale = resolveClassicLocale('en', 'CZ');

  it('prints the free-text company register identifier when set', () => {
    const document = buildFakeDocument({
      issuerCountry: 'CZ',
      issuerIdentifiers: {
        companyRegister: 'C 12345 vedená u Městského soudu v Praze (NOZ § 435)',
      },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain(
      'Company register: C 12345 vedená u Městského soudu v Praze (NOZ § 435)',
    );
  });

  it('prints nothing when left blank', () => {
    const document = buildFakeDocument({ issuerCountry: 'CZ', issuerIdentifiers: {} });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('Company register');
  });
});
