import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

const ro = getCountryConfig('RO');

describe('RO country config — VAT rates', () => {
  it('carries the standard 21% rate as the default', () => {
    expect(ro.defaultVatRateBp).toBe(2100);
    expect(ro.vatRates).toContainEqual({ rateBp: 2100, label: '21%' });
  });

  it('carries the single consolidated 11% reduced rate', () => {
    expect(ro.vatRates).toContainEqual({ rateBp: 1100, label: '11%' });
  });

  it('carries the 0% rate', () => {
    expect(ro.vatRates).toContainEqual({ rateBp: 0, label: '0%' });
  });

  it('offers exactly three rates', () => {
    expect(ro.vatRates).toHaveLength(3);
  });
});

describe('RO country config — VAT number pattern', () => {
  it('accepts a real-shaped RO VAT number with the country prefix', () => {
    expect(ro.vatNumberPattern?.test('RO18547290')).toBe(true);
    expect(ro.vatNumberPattern?.test('ro18547290')).toBe(true);
  });

  it('rejects a bare CUI without the RO prefix', () => {
    expect(ro.vatNumberPattern?.test('18547290')).toBe(false);
  });

  it('rejects another country prefix', () => {
    expect(ro.vatNumberPattern?.test('BG123456789')).toBe(false);
  });
});

describe('RO country config — exemption grounds', () => {
  it('forces the small-enterprise ground as the default for a non-registered issuer', () => {
    expect(ro.defaultExemptionGround).toBe('Scutit de TVA conform art. 310 din Codul fiscal');
  });

  it('does not offer the small-enterprise ground in the selectable list', () => {
    expect(ro.exemptionGrounds).not.toContain(ro.defaultExemptionGround);
  });

  it('offers the intra-community supply ground referenced in the composer', () => {
    expect(ro.exemptionGrounds).toContain(
      'Scutit cu drept de deducere conform art. 294 alin. (2) lit. a) din Codul fiscal',
    );
  });
});

describe('RO country config — identifiers', () => {
  it('carries the trade register number and the share capital as optional identifiers', () => {
    const keys = ro.identifiers.map((field) => field.key);
    expect(keys).toEqual(['regCom', 'capitalSocial']);
    expect(ro.identifiers.every((field) => !field.required)).toBe(true);
  });

  it('accepts an old-format trade register number', () => {
    const regCom = ro.identifiers.find((field) => field.key === 'regCom');
    expect(regCom?.pattern?.test('J40/1234/2020')).toBe(true);
    expect(regCom?.pattern?.test('F23/456/2010')).toBe(true);
  });

  it('accepts a new-format (post-2024) trade register number', () => {
    const regCom = ro.identifiers.find((field) => field.key === 'regCom');
    expect(regCom?.pattern?.test('J2001002345400')).toBe(true);
  });

  it('rejects a malformed trade register number', () => {
    const regCom = ro.identifiers.find((field) => field.key === 'regCom');
    expect(regCom?.pattern?.test('40/1234/2020')).toBe(false);
    expect(regCom?.pattern?.test('J40-1234-2020')).toBe(false);
  });
});

describe('RO country config — issuer fields and layout switches', () => {
  it('requires the core seller block fields, structured, with the județ', () => {
    expect(ro.requiredIssuerFields).toEqual([
      'companyName',
      'eik',
      'street',
      'postcode',
      'city',
      'countyRegion',
    ]);
  });

  it('requires a județ, in free text', () => {
    expect(ro.countyRegion).toEqual({ label: 'Județ', required: true, pattern: null });
  });

  it('prints no MOL row, no signature row, no original stamp', () => {
    expect(ro.showMol).toBe(false);
    expect(ro.showSignatureRow).toBe(false);
    expect(ro.showOriginalStamp).toBe(false);
  });

  it('uses CUI/CIF as the company id label and ro as the document language', () => {
    expect(ro.companyIdLabel).toBe('CUI/CIF');
    expect(ro.language).toBe('ro');
  });
});
