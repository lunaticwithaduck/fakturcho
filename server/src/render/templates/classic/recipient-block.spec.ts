import { describe, expect, it } from 'vitest';
import { resolveClassicLocale } from './locale';
import { buildRecipientBlock } from './recipient-block';
import { buildFakeDocument } from './testing/fake-document';

describe('buildRecipientBlock — same-country client keeps the domestic VAT label', () => {
  // A same-country client must keep the ordinary domestic VAT label
  // regardless of whether the issuer's own country is inside or outside the
  // EU VAT area — resolveVatNumberLabel previously fell through to the
  // foreign-fallback label for any non-EU client country, even when that
  // country was the issuer's own (GB-01, NO-01 in the 2026-09-26 prod test).
  it('GB issuer, GB client: keeps "VAT no.", not the foreign "Tax ID" fallback', () => {
    const locale = resolveClassicLocale('en', 'GB');
    const document = buildFakeDocument({
      recipientCountry: 'GB',
      recipientVatNumber: 'GB980780699',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('VAT no.: GB980780699');
    expect(html).not.toContain('Tax ID');
  });

  it('NO issuer, NO client: keeps "VAT no.", not the foreign "Tax ID" fallback', () => {
    const locale = resolveClassicLocale('en', 'NO');
    const document = buildFakeDocument({
      recipientCountry: 'NO',
      recipientVatNumber: 'NO923609016M99',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('VAT no.: NO923609016M99');
    expect(html).not.toContain('Tax ID');
  });

  it('CH issuer, CH client: keeps "VAT no.", not the foreign MWST-Nr. fallback', () => {
    const locale = resolveClassicLocale('en', 'CH');
    const document = buildFakeDocument({
      recipientCountry: 'CH',
      recipientVatNumber: 'CHE-116.281.710 MWST',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('VAT no.: CHE-116.281.710 MWST');
    expect(html).not.toContain('MWST-Nr.');
  });

  it('US issuer, US client: keeps "VAT no.", not the foreign "Tax ID" fallback', () => {
    const locale = resolveClassicLocale('en', 'US');
    const document = buildFakeDocument({
      recipientCountry: 'US',
      recipientVatNumber: 'US-EIN-12-3456789',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('VAT no.: US-EIN-12-3456789');
    expect(html).not.toContain('Tax ID');
  });

  it('DE issuer, DE client (EU-EU): keeps the normal domestic VAT label', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const document = buildFakeDocument({
      recipientCountry: 'DE',
      recipientVatNumber: 'DE123456789',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('USt-IdNr.: DE123456789');
    expect(html).not.toContain('Steuernummer');
  });
});

describe('buildRecipientBlock — same-country client keeps the domestic registration-id label', () => {
  it('GB issuer, GB client: keeps "Company registration no.", not the generic fallback', () => {
    const locale = resolveClassicLocale('en', 'GB');
    const document = buildFakeDocument({ recipientCountry: 'GB', recipientEik: 'GB-REG-001' });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Company registration no.: GB-REG-001');
    expect(html).not.toContain('Registration no.');
  });

  it('NO issuer, NO client: keeps "Company registration no.", not the generic fallback', () => {
    const locale = resolveClassicLocale('en', 'NO');
    const document = buildFakeDocument({ recipientCountry: 'NO', recipientEik: 'NO-REG-001' });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Company registration no.: NO-REG-001');
    expect(html).not.toContain('Registration no.');
  });

  it('CH issuer, CH client: keeps "Company registration no.", not the UID override', () => {
    const locale = resolveClassicLocale('en', 'CH');
    const document = buildFakeDocument({ recipientCountry: 'CH', recipientEik: 'CHE-123.456.789' });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Company registration no.: CHE-123.456.789');
    expect(html).not.toContain('UID:');
  });

  it('US issuer, US client: keeps "Company registration no.", not the EIN override', () => {
    const locale = resolveClassicLocale('en', 'US');
    const document = buildFakeDocument({ recipientCountry: 'US', recipientEik: '12-3456789' });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Company registration no.: 12-3456789');
    expect(html).not.toContain('EIN:');
  });

  it('DE issuer, DE client (EU-EU): keeps the domestic registration-id label', () => {
    const locale = resolveClassicLocale('de', 'DE');
    const document = buildFakeDocument({ recipientCountry: 'DE', recipientEik: 'HRB 12345' });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('Handelsregisternummer: HRB 12345');
  });
});

describe('buildRecipientBlock — foreign client VAT label follows the document language, not the client country', () => {
  // US-04 in the 2026-09-26 prod test: an English document from a US issuer
  // to a Swiss client printed the German "MWST-Nr.:" regardless of document
  // language — the label must be chosen per document language instead.
  it('US issuer, CH client, English document: "VAT no.", not "MWST-Nr."', () => {
    const locale = resolveClassicLocale('en', 'US');
    const document = buildFakeDocument({
      recipientCountry: 'CH',
      recipientVatNumber: 'CHE-116.281.710 MWST',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('VAT no.: CHE-116.281.710 MWST');
    expect(html).not.toContain('MWST-Nr.');
  });

  it('US issuer, CH client, German document: keeps "MWST-Nr."', () => {
    const locale = resolveClassicLocale('de', 'US');
    const document = buildFakeDocument({
      recipientCountry: 'CH',
      recipientVatNumber: 'CHE-116.281.710 MWST',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('MWST-Nr.: CHE-116.281.710 MWST');
  });

  it('US issuer, CH client, French document: "N° TVA", not "MWST-Nr."', () => {
    const locale = resolveClassicLocale('fr', 'US');
    const document = buildFakeDocument({
      recipientCountry: 'CH',
      recipientVatNumber: 'CHE-116.281.710 MWST',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('N° TVA : CHE-116.281.710 MWST');
    expect(html).not.toContain('MWST-Nr.');
  });

  it('US issuer, CH client, Italian document: "N. IVA", not "MWST-Nr."', () => {
    const locale = resolveClassicLocale('it', 'US');
    const document = buildFakeDocument({
      recipientCountry: 'CH',
      recipientVatNumber: 'CHE-116.281.710 MWST',
    });
    const html = buildRecipientBlock(document, 'invoice', locale);
    expect(html).toContain('N. IVA: CHE-116.281.710 MWST');
    expect(html).not.toContain('MWST-Nr.');
  });

  it("EIN and UID stay the same across document languages (they're loanwords, not translated)", () => {
    const localeEn = resolveClassicLocale('en', 'DE');
    const localeDe = resolveClassicLocale('de', 'DE');
    for (const locale of [localeEn, localeDe]) {
      const document = buildFakeDocument({ recipientCountry: 'US', recipientEik: '12-3456789' });
      const html = buildRecipientBlock(document, 'invoice', locale);
      expect(html).toContain('EIN: 12-3456789');
    }
  });
});
