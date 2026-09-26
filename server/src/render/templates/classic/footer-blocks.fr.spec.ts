import { describe, expect, it } from 'vitest';
import { buildIssuerBlock } from './footer-blocks';
import { resolveClassicLocale } from './locale';
import { buildFakeDocument } from './testing/fake-document';

describe('buildIssuerBlock — FR sole trader "EI" mention (C. com. L526-22, R526-26)', () => {
  const locale = resolveClassicLocale('fr', 'FR');

  it('prints "EI" right after the name and not as a separate row', () => {
    const document = buildFakeDocument({
      issuerCompanyName: 'Camille Roux',
      issuerIdentifiers: { legalForm: 'EI' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Camille Roux EI');
    expect(html).not.toContain('Forme juridique');
  });

  it('accepts the spelled-out "entrepreneur individuel" form too', () => {
    const document = buildFakeDocument({
      issuerCompanyName: 'Camille Roux',
      issuerIdentifiers: { legalForm: 'entrepreneur individuel' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Camille Roux entrepreneur individuel');
    expect(html).not.toContain('Forme juridique');
  });

  it('still prints any other legal form as its own row next to the name, unchanged', () => {
    const document = buildFakeDocument({
      issuerCompanyName: 'Acme',
      issuerIdentifiers: { legalForm: 'SARL' },
    });
    const html = buildIssuerBlock(document, 'invoice', locale);
    expect(html).toContain('Acme</div>');
    expect(html).toContain('Forme juridique : SARL');
  });
});
