import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildIssuerBlock — structured street/postcode/city address', () => {
  const locale = resolveClassicLocale('de', 'DE');

  it('prints street, postcode and city when there is no addressLine', () => {
    const document = buildFakeDocument({
      issuerAddressLine: null,
      issuerStreet: 'Musterstraße 1',
      issuerPostcode: '10115',
      issuerCity: 'Berlin',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Musterstraße 1, 10115 Berlin');
  });

  it('still prints the combined addressLine when one is set', () => {
    const document = buildFakeDocument({
      issuerAddressLine: 'Musterstraße 1',
      issuerStreet: null,
      issuerPostcode: null,
      issuerCity: 'Berlin',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Musterstraße 1, Berlin');
  });

  it('prints the Steuernummer identifier with its label', () => {
    const document = buildFakeDocument({
      issuerIdentifiers: { steuernummer: '27/815/08150' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Steuernummer: 27/815/08150');
  });

  it('prints Registergericht, Sitz and Geschäftsführer when set, keeping each short value on one line', () => {
    const document = buildFakeDocument({
      issuerIdentifiers: {
        steuernummer: '27/815/08150',
        registergericht: 'Amtsgericht München',
        sitz: 'München',
        geschaeftsfuehrer: 'Max Mustermann',
      },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    // Short (<= 40 chars) multi-word values are joined with non-breaking
    // spaces so a court/name never wraps one word onto its own line.
    expect(html).toContain('Registergericht: Amtsgericht München');
    expect(html).toContain('Sitz: München');
    expect(html).toContain('Geschäftsführer: Max Mustermann');
  });

  it('leaves a value longer than 40 characters wrapping normally', () => {
    const longCourtName = 'Amtsgericht Charlottenburg-Wilmersdorf Berlin-Mitte';
    expect(longCourtName.length).toBeGreaterThan(40);
    const document = buildFakeDocument({
      issuerIdentifiers: { registergericht: longCourtName },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain(`Registergericht: ${longCourtName}`);
    expect(html).not.toContain(' ');
  });

  it('prints nothing for Registergericht, Sitz or Geschäftsführer for a sole trader who left them blank', () => {
    const document = buildFakeDocument({
      issuerIdentifiers: { steuernummer: '27/815/08150' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).not.toContain('Registergericht');
    expect(html).not.toContain('Sitz:');
    expect(html).not.toContain('Geschäftsführer');
  });
});
