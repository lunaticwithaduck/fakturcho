import { getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('generic EU country config (e.g. NL)', () => {
  const config = getCountryConfig('NL');

  it('defaults a non-VAT-registered issuer to the EU-wide SME exemption', () => {
    expect(config.defaultExemptionGround).toBe(
      'VAT exemption for small enterprises, Article 284 of Council Directive 2006/112/EC',
    );
  });

  it('offers reverse-charge, intra-Community, export and general exempt grounds', () => {
    expect(config.exemptionGrounds).toEqual([
      'VAT exemption for small enterprises, Article 284 of Council Directive 2006/112/EC',
      'Reverse charge, Article 196 of Council Directive 2006/112/EC',
      'Intra-Community supply, Article 138 of Council Directive 2006/112/EC',
      'Export, Article 146 of Council Directive 2006/112/EC',
      'Exempt supply, Article 132 or 135 of Council Directive 2006/112/EC',
    ]);
  });
});

describe('generic non-EU country config (e.g. US)', () => {
  it('carries no exemption grounds at all', () => {
    const config = getCountryConfig('US');
    expect(config.exemptionGrounds).toEqual([]);
    expect(config.defaultExemptionGround).toBeNull();
  });
});
