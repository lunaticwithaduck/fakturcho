import { describe, expect, it, vi } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const NOTE_COUNTRY = 'ZZ';
const NOTE_GROUND = 'Some VAT note, not an exemption';

vi.mock('@fakturcho/shared-types', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@fakturcho/shared-types')>();
  return {
    ...actual,
    getCountryConfig: (country: string) => {
      const config = actual.getCountryConfig(country);
      return country === NOTE_COUNTRY ? { ...config, vatNoteGrounds: [NOTE_GROUND] } : config;
    },
  };
});

const presentation: VatPresentation = {
  vatCharged: false,
  showExemptionLine: true,
  exemptionGround: NOTE_GROUND,
};

describe('a ground listed in vatNoteGrounds prints without the exemption prefix', () => {
  it('prints the ground alone when the issuer country lists it as a note', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ vatExemptionGround: NOTE_GROUND, issuerCountry: NOTE_COUNTRY }),
      lineItems: buildFakeLineItems(),
      presentation,
      isDraft: false,
      language: 'en',
      issuerCountry: NOTE_COUNTRY,
    });
    expect(html).toContain(`<div class="exemption">${NOTE_GROUND}</div>`);
    expect(html).not.toContain(`VAT exemption ground: ${NOTE_GROUND}`);
  });

  it('keeps the exemption prefix for a country that does not list the ground as a note', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ vatExemptionGround: NOTE_GROUND, issuerCountry: 'DE' }),
      lineItems: buildFakeLineItems(),
      presentation,
      isDraft: false,
      language: 'en',
      issuerCountry: 'DE',
    });
    expect(html).toContain(`VAT exemption ground: ${NOTE_GROUND}`);
  });
});
