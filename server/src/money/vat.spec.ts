import { DEFAULT_EXEMPTION_GROUND, VAT_EXEMPTION_GROUNDS } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { DomainError } from '../common/domain-error';
import { resolveVatPresentation, validateVatGround } from './vat';

describe('validateVatGround — invariant 12: non-registered issuer', () => {
  it('forces чл.113, ал.9 от ЗДДС when no ground is requested', () => {
    expect(validateVatGround({ vatRegistered: false, vatRateBp: 0 })).toBe(
      DEFAULT_EXEMPTION_GROUND,
    );
  });

  it('accepts the default ground if explicitly (correctly) requested', () => {
    expect(
      validateVatGround({
        vatRegistered: false,
        vatRateBp: 0,
        requestedGround: DEFAULT_EXEMPTION_GROUND,
      }),
    ).toBe(DEFAULT_EXEMPTION_GROUND);
  });

  it('rejects any other ground with VAT_GROUND_NOT_ALLOWED', () => {
    const attempt = () =>
      validateVatGround({
        vatRegistered: false,
        vatRateBp: 0,
        requestedGround: VAT_EXEMPTION_GROUNDS[0],
      });
    expect(attempt).toThrow(DomainError);
    try {
      attempt();
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('VAT_GROUND_NOT_ALLOWED');
    }
  });
});

describe('validateVatGround — invariant 13: registered issuer at 20%', () => {
  it('returns null: no exemption ground at all', () => {
    expect(validateVatGround({ vatRegistered: true, vatRateBp: 2000 })).toBeNull();
  });

  it('rejects any attempt to set a ground', () => {
    const attempt = () =>
      validateVatGround({
        vatRegistered: true,
        vatRateBp: 2000,
        requestedGround: DEFAULT_EXEMPTION_GROUND,
      });
    expect(attempt).toThrow(DomainError);
  });
});

describe('validateVatGround — registered issuer at 0%', () => {
  it('accepts a ground from the statutory list, stored verbatim', () => {
    const ground = VAT_EXEMPTION_GROUNDS[3];
    expect(validateVatGround({ vatRegistered: true, vatRateBp: 0, requestedGround: ground })).toBe(
      ground,
    );
  });

  it('rejects a missing ground', () => {
    expect(() => validateVatGround({ vatRegistered: true, vatRateBp: 0 })).toThrow(DomainError);
  });

  it('rejects a ground outside the statutory list', () => {
    expect(() =>
      validateVatGround({ vatRegistered: true, vatRateBp: 0, requestedGround: 'made up' }),
    ).toThrow(DomainError);
  });
});

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
