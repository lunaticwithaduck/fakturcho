import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('generic EU country config (e.g. NL)', () => {
  const config = getCountryConfig('NL');

  it('defaults a non-VAT-registered issuer to the EU-wide SME exemption', () => {
    expect(config.defaultExemptionGround).toBe(
      'Small enterprise scheme – Article 284 of Council Directive 2006/112/EC',
    );
  });

  it('offers reverse-charge, non-EU B2B, intra-Community, export and general exempt grounds', () => {
    expect(config.exemptionGrounds).toEqual([
      'Small enterprise scheme – Article 284 of Council Directive 2006/112/EC',
      'Reverse charge – Article 196 of Council Directive 2006/112/EC',
      'Not subject to VAT – place of supply outside the EU, Article 44 of Council Directive 2006/112/EC',
      'Intra-Community supply, Article 138 of Council Directive 2006/112/EC',
      'Export, Article 146 of Council Directive 2006/112/EC',
      'Exempt supply, Article 132 of Council Directive 2006/112/EC',
      'Exempt supply, Article 135 of Council Directive 2006/112/EC',
    ]);
  });

  it('offers an optional free-text company-register identifier for a country with no dedicated config', () => {
    expect(config.identifiers).toContainEqual({
      key: 'companyRegister',
      label: 'Company register',
      pattern: null,
      required: false,
    });
  });
});

describe('generic non-EU country config (e.g. US)', () => {
  it('carries no exemption grounds at all', () => {
    const config = getCountryConfig('US');
    expect(config.exemptionGrounds).toEqual([]);
    expect(config.defaultExemptionGround).toBeNull();
  });

  it('has no VAT/GST rate of its own — the flat 0% placeholder is correct, unlike GB/CH/NO', () => {
    const config = getCountryConfig('US');
    expect(config.vatRates).toEqual([{ rateBp: 0, label: '0%' }]);
    expect(config.defaultVatRateBp).toBe(0);
  });
});

// gov.uk/vat-rates, verified 2026-09-26.
describe('non-EU issuer country config — GB', () => {
  const config = getCountryConfig('GB');

  it('offers the real UK standard, reduced and zero rates, not a flat 0%', () => {
    expect(config.vatRates).toEqual([
      { rateBp: 2000, label: '20%' },
      { rateBp: 500, label: '5%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(2000);
  });
});

// estv.admin.ch/en/vat-rates-switzerland, verified 2026-09-26 (rates in force
// since 1 January 2024, unchanged for 2026).
describe('non-EU issuer country config — CH', () => {
  const config = getCountryConfig('CH');

  it('offers the real Swiss normal, special and reduced rates, not a flat 0%', () => {
    expect(config.vatRates).toEqual([
      { rateBp: 810, label: '8.1%' },
      { rateBp: 380, label: '3.8%' },
      { rateBp: 260, label: '2.6%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(810);
  });
});

// skatteetaten.no/en/rates/value-added-tax, verified 2026-09-26.
describe('non-EU issuer country config — NO', () => {
  const config = getCountryConfig('NO');

  it('offers the real Norwegian general and reduced rates, not a flat 0%', () => {
    expect(config.vatRates).toEqual([
      { rateBp: 2500, label: '25%' },
      { rateBp: 1500, label: '15%' },
      { rateBp: 1200, label: '12%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(2500);
  });
});
