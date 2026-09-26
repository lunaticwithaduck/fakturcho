import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('CZ country config', () => {
  const config = getCountryConfig('CZ');

  it('carries the current standard and reduced VAT rates', () => {
    expect(config.vatRates).toEqual([
      { rateBp: 2100, label: '21%' },
      { rateBp: 1200, label: '12%' },
      { rateBp: 0, label: '0%' },
    ]);
    expect(config.defaultVatRateBp).toBe(2100);
  });

  it('requires the company-register identifier so NOZ § 435 odst. 1 (89/2012 Sb.) is satisfied', () => {
    const companyRegister = config.identifiers.find((field) => field.key === 'companyRegister');
    expect(companyRegister).toMatchObject({
      label: 'Zápis v obchodním rejstříku',
      pattern: null,
      required: true,
    });
  });

  it('requires the structured address fields shared with every generic EU country', () => {
    expect(config.requiredIssuerFields).toEqual(['companyName', 'street', 'city', 'postcode']);
  });
});
