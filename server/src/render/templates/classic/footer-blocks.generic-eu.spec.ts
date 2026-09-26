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
    // A short value (<= 40 chars) is joined with non-breaking spaces so it
    // never wraps one word onto its own line.
    expect(html).toContain('Company register: KVK 12345678');
  });

  it('prints nothing when left blank', () => {
    const document = buildFakeDocument({ issuerCountry: 'NL', issuerIdentifiers: {} });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('Company register');
  });
});

describe('buildIssuerBlock — CZ company register (NOZ § 435)', () => {
  it('prints the Czech register entry with a label in the document language, not the Czech config label', () => {
    const document = buildFakeDocument({
      issuerCountry: 'CZ',
      issuerIdentifiers: {
        companyRegister: 'C 12345 vedená u Městského soudu v Praze',
      },
    });
    const enHtml = buildIssuerBlock(document, 'invoice', resolveClassicLocale('en', 'CZ'));
    // Exactly 40 chars, so it is joined with non-breaking spaces (item 9: keep
    // a short multi-word identifier value on one line).
    expect(enHtml).toContain('Register entry: C 12345 vedená u Městského soudu v Praze');
    expect(enHtml).not.toContain('Zápis v rejstříku');

    const deHtml = buildIssuerBlock(document, 'invoice', resolveClassicLocale('de', 'CZ'));
    expect(deHtml).toContain('Registereintrag: C 12345 vedená u Městského soudu v Praze');
  });

  it('prints nothing when left blank', () => {
    const document = buildFakeDocument({ issuerCountry: 'CZ', issuerIdentifiers: {} });
    const html = buildIssuerBlock(document, 'invoice', resolveClassicLocale('en', 'CZ'));
    expect(html).not.toContain('Register entry');
  });
});
