import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('generic EU country config (e.g. NL)', () => {
  const config = getCountryConfig('NL');

  it('defaults a non-VAT-registered issuer to the EU-wide SME exemption', () => {
    expect(config.defaultExemptionGround).toBe(
      'Small enterprise scheme – Article 284 of Council Directive 2006/112/EC',
    );
  });

  it('offers reverse-charge, intra-Community, export and general exempt grounds', () => {
    expect(config.exemptionGrounds).toEqual([
      'Small enterprise scheme – Article 284 of Council Directive 2006/112/EC',
      'Reverse charge – Article 196 of Council Directive 2006/112/EC',
      'Intra-Community supply, Article 138 of Council Directive 2006/112/EC',
      'Export, Article 146 of Council Directive 2006/112/EC',
      'Exempt supply, Article 132 of Council Directive 2006/112/EC',
      'Exempt supply, Article 135 of Council Directive 2006/112/EC',
    ]);
  });

  it('offers an optional free-text company-register identifier (e.g. a Czech s.r.o.)', () => {
    const czConfig = getCountryConfig('CZ');
    expect(czConfig.identifiers).toContainEqual({
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
});
