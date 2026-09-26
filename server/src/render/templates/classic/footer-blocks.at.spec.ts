import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildIssuerBlock — AT issuer', () => {
  const locale = resolveClassicLocale('de', 'AT');

  it('labels the company id row Firmenbuchnummer, not the German Handelsregisternummer', () => {
    const document = buildFakeDocument({ issuerEik: '123456a' });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Firmenbuchnummer');
    expect(html).not.toContain('Handelsregisternummer');
  });

  it('prefixes the VAT number with UID-Nr., not the German USt-IdNr.', () => {
    const document = buildFakeDocument({ issuerVatNumber: 'ATU12345678' });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('UID-Nr.: ATU12345678');
    expect(html).not.toContain('USt-IdNr.');
  });

  it('prints Firmenbuchgericht, Sitz and Rechtsform when set', () => {
    const document = buildFakeDocument({
      issuerIdentifiers: {
        firmenbuchgericht: 'Handelsgericht Wien',
        sitz: 'Wien',
        rechtsform: 'GmbH',
      },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    // A short value (<= 40 chars) is joined with non-breaking spaces so it
    // never wraps one word onto its own line.
    expect(html).toContain('Firmenbuchgericht: Handelsgericht Wien');
    expect(html).toContain('Sitz: Wien');
    expect(html).toContain('Rechtsform: GmbH');
  });

  it('prints nothing for Firmenbuchgericht or Sitz for an unregistered sole trader who left them blank', () => {
    const document = buildFakeDocument({ issuerIdentifiers: {} });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('Firmenbuchgericht');
    expect(html).not.toContain('Sitz:');
  });
});
