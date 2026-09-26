import { describe, expect, it } from 'vitest';
import type { VatPresentation } from '../../../money/vat';
import { renderClassicTemplateHtml } from './template';
import { buildFakeDocument, buildFakeLineItems } from './testing/fake-document';

const vatChargedPresentation: VatPresentation = {
  vatCharged: true,
  showExemptionLine: false,
  exemptionGround: null,
};

function renderDe(overrides: Parameters<typeof buildFakeDocument>[0] = {}) {
  return renderClassicTemplateHtml({
    document: buildFakeDocument({ issuerCountry: 'DE', recipientCountry: 'DE', ...overrides }),
    lineItems: buildFakeLineItems(),
    presentation: vatChargedPresentation,
    isDraft: false,
    language: 'de',
    issuerCountry: 'DE',
  });
}

describe('DE stage-1 legal wording fixes', () => {
  it('formats the VAT rate line per DIN 5008 (space before %, no parentheses)', () => {
    const html = renderDe();
    expect(html).toContain('USt. 20 %:');
    expect(html).not.toContain('USt. (20%):');
  });

  it('labels the price columns as net unit/line prices', () => {
    const html = renderDe();
    expect(html).toContain('Einzelpreis (netto)');
    expect(html).toContain('Gesamtpreis (netto)');
    expect(html).not.toContain('<th>Preis</th>');
    expect(html).not.toContain('<th>Gesamt</th>');
  });

  it('uses Lieferanschrift, not Rechnungsempfänger, on a Lieferschein', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        documentType: 'DELIVERY_NOTE',
        issuerCountry: 'DE',
        recipientCountry: 'DE',
      }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: false,
      language: 'de',
      issuerCountry: 'DE',
    });
    expect(html).toContain('Lieferanschrift:');
    expect(html).not.toContain('Rechnungsempfänger:');
  });

  it('stamps a draft with a watermark that denies legal validity without echoing the EN wording', () => {
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        status: 'DRAFT',
        number: null,
        issuerCountry: 'DE',
        recipientCountry: 'DE',
      }),
      lineItems: buildFakeLineItems(),
      presentation: vatChargedPresentation,
      isDraft: true,
      language: 'de',
      issuerCountry: 'DE',
    });
    expect(html).toContain('KEINE GÜLTIGE RECHNUNG');
  });

  it('names the Kleinunternehmer exemption itself, per § 34a Nr. 5 UStDV, not just "no VAT charged"', () => {
    const ground = 'Steuerbefreiung für Kleinunternehmer gemäß § 19 Abs. 1 UStG.';
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        issuerCountry: 'DE',
        recipientCountry: 'DE',
        issuerVatRegistered: false,
        vatRateBp: 0,
        vatAmount: 0,
        vatExemptionGround: ground,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'E', vatRateBp: 0 }),
      presentation: { vatCharged: false, showExemptionLine: true, exemptionGround: ground },
      isDraft: false,
      language: 'de',
      issuerCountry: 'DE',
    });
    expect(html).toContain('Steuerbefreiung für Kleinunternehmer gemäß § 19 Abs. 1 UStG.');
  });

  it('prints only the § 3a Abs. 2 UStG / Art. 196 note once for a cross-border B2B service, not the domestic § 13b note', () => {
    const ground =
      'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG) – Steuerschuldnerschaft des Leistungsempfängers (Art. 196 MwStSystRL)';
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        issuerCountry: 'DE',
        recipientCountry: 'FR',
        vatRateBp: 0,
        vatAmount: 0,
        vatExemptionGround: ground,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 }),
      presentation: { vatCharged: false, showExemptionLine: true, exemptionGround: ground },
      isDraft: false,
      language: 'de',
      issuerCountry: 'DE',
    });
    const occurrences = html.split('Art. 196 MwStSystRL').length - 1;
    expect(occurrences).toBe(1);
    expect(html).not.toContain('gemäß § 13b UStG');
  });

  it('prints the domestic § 13b note for a domestic reverse charge, not the Art. 196 one', () => {
    const ground = 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG';
    const html = renderClassicTemplateHtml({
      document: buildFakeDocument({
        issuerCountry: 'DE',
        recipientCountry: 'DE',
        vatRateBp: 0,
        vatAmount: 0,
        vatExemptionGround: ground,
      }),
      lineItems: buildFakeLineItems({ vatCategory: 'AE', vatRateBp: 0 }),
      presentation: { vatCharged: false, showExemptionLine: true, exemptionGround: ground },
      isDraft: false,
      language: 'de',
      issuerCountry: 'DE',
    });
    expect(html).toContain('gemäß § 13b UStG');
    expect(html).not.toContain('Art. 196 MwStSystRL');
  });
});
