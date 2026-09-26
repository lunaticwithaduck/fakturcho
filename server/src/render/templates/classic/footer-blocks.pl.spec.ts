import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildIssuerBlock — PL identifiers', () => {
  const locale = resolveClassicLocale('pl', 'PL');

  it('prints Sąd rejestrowy and Kapitał zakładowy when set', () => {
    const document = buildFakeDocument({
      issuerIdentifiers: {
        krs: '0000123456',
        sadRejestrowy: 'Sąd Rejonowy dla m.st. Warszawy, XII Wydział Gospodarczy KRS',
        kapitalZakladowy: '5 000 PLN',
      },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain(
      'Sąd rejestrowy: Sąd Rejonowy dla m.st. Warszawy, XII Wydział Gospodarczy KRS',
    );
    // A short value (<= 40 chars) is joined with non-breaking spaces so it
    // never wraps one word onto its own line.
    expect(html).toContain('Kapitał zakładowy: 5 000 PLN');
  });

  it('prints nothing for a sole trader who left them blank', () => {
    const document = buildFakeDocument({ issuerIdentifiers: {} });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('Sąd rejestrowy');
    expect(html).not.toContain('Kapitał zakładowy');
  });
});
