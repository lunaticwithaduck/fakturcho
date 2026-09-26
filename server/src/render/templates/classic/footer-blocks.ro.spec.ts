import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildIssuerBlock — RO CUI prints without the VAT-registration prefix (Cod fiscal art. 316/317)', () => {
  const locale = resolveClassicLocale('ro', 'RO');

  it('strips a leading RO from the CUI when the issuer has no VAT number', () => {
    const document = buildFakeDocument({
      issuerEik: 'RO11224455',
      issuerVatRegistered: false,
      issuerVatNumber: null,
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('CUI: 11224455');
    expect(html).not.toContain('CUI: RO11224455');
  });

  it('keeps the CUI as stored when the issuer is VAT-registered', () => {
    const document = buildFakeDocument({
      issuerEik: 'RO11224455',
      issuerVatRegistered: true,
      issuerVatNumber: 'RO11224455',
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('CUI: RO11224455');
  });
});
