import { describe, expect, it } from 'vitest';
import { resolveVatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const REVERSE_CHARGE_GROUND = 'Reverse charge – Article 196 of Council Directive 2006/112/EC';

describe('English PDF wording (generic EU issuer, e.g. IE)', () => {
  it('labels the supply date, the net and gross totals in natural English', () => {
    const presentation = resolveVatPresentation({
      vatRegistered: true,
      vatRateBp: 2000,
      vatExemptionGround: null,
      documentType: 'invoice',
    });
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ issuerCountry: 'IE' }),
      lineItems: buildFakeLineItems(),
      presentation,
      isDraft: false,
      language: 'en',
      issuerCountry: 'IE',
    });

    expect(html).toContain('Date of supply: 02/08/2026');
    expect(html).not.toContain('Tax event:');
    expect(html).toContain('Net amount (excl. VAT):');
    expect(html).not.toContain('Taxable amount:');
    expect(html).toContain('Total (incl. VAT):');
  });

  it('prints the reverse-charge ground on its own, not as a VAT exemption', () => {
    const presentation = resolveVatPresentation({
      vatRegistered: true,
      vatRateBp: 0,
      vatExemptionGround: REVERSE_CHARGE_GROUND,
      documentType: 'invoice',
    });
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        issuerCountry: 'IE',
        vatRateBp: 0,
        vatAmount: 0,
        vatExemptionGround: REVERSE_CHARGE_GROUND,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 }),
      presentation,
      isDraft: false,
      language: 'en',
      issuerCountry: 'IE',
    });

    expect(html).toContain(`<div class="exemption">${REVERSE_CHARGE_GROUND}</div>`);
    expect(html).not.toContain(`VAT exemption ground: ${REVERSE_CHARGE_GROUND}`);
    // The reverse-charge ground text must match labels.reverseChargeNote exactly,
    // otherwise mentions/generic.ts prints the note a second time (a real
    // duplicate observed while visually checking scenario 02 on srv1w).
    expect((html.match(/Article 196 of Council Directive 2006\/112\/EC/g) ?? []).length).toBe(1);
  });

  it('still prefixes a genuine exemption ground with "VAT exemption ground:"', () => {
    const smallBusinessGround =
      'Small enterprise scheme – Article 284 of Council Directive 2006/112/EC';
    const presentation = resolveVatPresentation({
      vatRegistered: false,
      vatRateBp: 0,
      vatExemptionGround: smallBusinessGround,
      documentType: 'invoice',
    });
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        issuerCountry: 'IE',
        vatRateBp: 0,
        vatAmount: 0,
        vatExemptionGround: smallBusinessGround,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'O', vatRateBp: 0 }),
      presentation,
      isDraft: false,
      language: 'en',
      issuerCountry: 'IE',
    });

    expect(html).toContain(`VAT exemption ground: ${smallBusinessGround}`);
  });

  it('titles a pro forma document with a space, as two words', () => {
    const presentation = resolveVatPresentation({
      vatRegistered: true,
      vatRateBp: 2000,
      vatExemptionGround: null,
      documentType: 'proforma',
    });
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({ documentType: 'PROFORMA', issuerCountry: 'IE' }),
      lineItems: buildFakeLineItems(),
      presentation,
      isDraft: false,
      language: 'en',
      issuerCountry: 'IE',
    });

    expect(html).toContain('Pro forma invoice');
    expect(html).not.toContain('Proforma invoice');
  });
});
