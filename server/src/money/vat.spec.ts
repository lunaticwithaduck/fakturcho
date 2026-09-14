import { DEFAULT_EXEMPTION_GROUND } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { resolveVatPresentation } from './vat';

describe('resolveVatPresentation — invariant 13: no exemption line at 20%', () => {
  it('charges VAT and shows no exemption line for a registered issuer at 20%', () => {
    const presentation = resolveVatPresentation({
      vatRegistered: true,
      vatRateBp: 2000,
      vatExemptionGround: null,
      documentType: 'invoice',
    });
    expect(presentation.vatCharged).toBe(true);
    expect(presentation.showExemptionLine).toBe(false);
    expect(presentation.exemptionGround).toBeNull();
  });
});

describe('resolveVatPresentation — invariant 14: proforma and quote never show the exemption line', () => {
  it.each(['proforma', 'quote'] as const)('%s never shows the exemption line', (documentType) => {
    const presentation = resolveVatPresentation({
      vatRegistered: false,
      vatRateBp: 0,
      vatExemptionGround: DEFAULT_EXEMPTION_GROUND,
      documentType,
    });
    expect(presentation.vatCharged).toBe(false);
    expect(presentation.showExemptionLine).toBe(false);
    expect(presentation.exemptionGround).toBeNull();
  });

  it.each(['invoice', 'credit_note', 'debit_note'] as const)(
    '%s shows the exemption line when VAT is not charged',
    (documentType) => {
      const presentation = resolveVatPresentation({
        vatRegistered: false,
        vatRateBp: 0,
        vatExemptionGround: DEFAULT_EXEMPTION_GROUND,
        documentType,
      });
      expect(presentation.showExemptionLine).toBe(true);
      expect(presentation.exemptionGround).toBe(DEFAULT_EXEMPTION_GROUND);
    },
  );
});
