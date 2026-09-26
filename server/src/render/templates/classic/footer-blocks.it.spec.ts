import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildIssuerBlock — IT art. 2250 c.c. issuer details', () => {
  const locale = resolveClassicLocale('it', 'IT');

  it('appends "in liquidazione" to the company name when the flag is set', () => {
    const document = buildFakeDocument({
      issuerCompanyName: 'Rossi Srl',
      issuerIdentifiers: { inLiquidazione: 'true' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Rossi Srl in liquidazione');
  });

  it('does not append "in liquidazione" when the flag is unset', () => {
    const document = buildFakeDocument({
      issuerCompanyName: 'Rossi Srl',
      issuerIdentifiers: {},
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Rossi Srl</div>');
    expect(html).not.toContain('in liquidazione');
  });

  it('prints "Socio unico" when the flag is set', () => {
    const document = buildFakeDocument({
      issuerIdentifiers: { socioUnico: 'true' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Socio unico');
  });

  it('does not print "Socio unico" when the flag is unset', () => {
    const document = buildFakeDocument({ issuerIdentifiers: {} });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('Socio unico');
  });

  it('appends "i.v." to the share capital when fully paid up', () => {
    const document = buildFakeDocument({
      issuerIdentifiers: { shareCapital: '10.000 €', capitaleVersato: 'true' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    // A short value (<= 40 chars) is joined with non-breaking spaces so it
    // never wraps one word onto its own line.
    expect(html).toContain('Capitale sociale: 10.000 € i.v.');
  });

  it('prints the share capital with no suffix when the flag is unset', () => {
    const document = buildFakeDocument({
      issuerIdentifiers: { shareCapital: '10.000 €' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Capitale sociale: 10.000 €');
    expect(html).not.toContain('i.v.');
  });
});
