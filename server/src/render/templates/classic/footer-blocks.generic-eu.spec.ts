import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildIssuerBlock — generic EU country (e.g. NL) company register', () => {
  const locale = resolveClassicLocale('en', 'NL');

  it('prints the free-text company register identifier when set', () => {
    const document = buildFakeDocument({
      issuerCountry: 'NL',
      issuerIdentifiers: {
        companyRegister: 'KVK 12345678',
      },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Company register: KVK 12345678');
  });

  it('prints nothing when left blank', () => {
    const document = buildFakeDocument({ issuerCountry: 'NL', issuerIdentifiers: {} });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('Company register');
  });
});

describe('buildIssuerBlock — CZ company register (NOZ § 435)', () => {
  const locale = resolveClassicLocale('en', 'CZ');

  it('prints the Czech register entry with its Czech label when set', () => {
    const document = buildFakeDocument({
      issuerCountry: 'CZ',
      issuerIdentifiers: {
        companyRegister: 'C 12345 vedená u Městského soudu v Praze',
      },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Zápis v obchodním rejstříku: C 12345 vedená u Městského soudu v Praze');
  });

  it('prints nothing when left blank', () => {
    const document = buildFakeDocument({ issuerCountry: 'CZ', issuerIdentifiers: {} });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('obchodním rejstříku');
  });
});
