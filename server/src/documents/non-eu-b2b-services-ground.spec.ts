import { defaultNonEuB2bServicesGround, getCountryConfig } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('defaultNonEuB2bServicesGround', () => {
  it('returns null when there is no client', () => {
    expect(defaultNonEuB2bServicesGround('BG', null, null)).toBeNull();
  });

  it('returns null for a consumer outside the EU (art. 45 keeps domestic VAT)', () => {
    expect(
      defaultNonEuB2bServicesGround('BG', null, { country: 'US', clientType: 'consumer' }),
    ).toBeNull();
  });

  it('returns null when the client type is unknown', () => {
    expect(
      defaultNonEuB2bServicesGround('BG', null, { country: 'US', clientType: null }),
    ).toBeNull();
  });

  it('returns null for a business client inside the EU (that is the reverse-charge case, not this one)', () => {
    expect(
      defaultNonEuB2bServicesGround('BG', null, { country: 'DE', clientType: 'business' }),
    ).toBeNull();
  });

  it('returns null when the client country is unknown', () => {
    expect(
      defaultNonEuB2bServicesGround('BG', null, { country: null, clientType: 'business' }),
    ).toBeNull();
  });

  it('returns null for a non-EU issuer (Directive 2006/112/EC does not govern it)', () => {
    expect(
      defaultNonEuB2bServicesGround('GB', null, { country: 'US', clientType: 'business' }),
    ).toBeNull();
  });

  const nonEuBusinessClient = { country: 'US', clientType: 'business' as const };

  it.each([
    ['AT', 'Nicht steuerbare sonstige Leistung gemäß § 3a Abs. 6 UStG 1994'],
    ['DE', 'Nicht im Inland steuerbare Leistung (§ 3a Abs. 2 UStG)'],
    ['FR', 'TVA non applicable – art. 259-1 du CGI'],
    ['IT', 'Operazione non soggetta ad IVA ai sensi dell’art. 7-ter'],
    ['PL', 'usługa niepodlegająca opodatkowaniu na terytorium kraju – art. 28b'],
    ['RO', 'Neimpozabil în România'],
    ['BG', 'чл. 21, ал. 2 от ЗДДС'],
    ['CZ', 'Article 44 of Council Directive 2006/112/EC'],
  ])(
    'gives %s issuer its own out-of-scope ground for a non-EU business client',
    (country, snippet) => {
      const ground = defaultNonEuB2bServicesGround(country, null, nonEuBusinessClient);
      expect(ground).not.toBeNull();
      expect(ground).toContain(snippet);
    },
  );

  // mentions/pl.ts prints "odwrotne obciążenie" whenever vatExemptionGround
  // is EXACTLY the EU B2B services ground string, and mentions/ro.ts prints
  // the reverse-charge note whenever the ground CONTAINS "art. 278 alin. (2)"
  // — both regardless of the line's own vatCategory. The non-EU default must
  // not accidentally trip either, since a non-EU business has no reverse
  // charge to self-assess.
  it('PL: the non-EU ground text differs from the exact EU reverse-charge ground plMentions matches', () => {
    const euGround = getCountryConfig('PL').exemptionGrounds.find((ground) =>
      ground.includes('art. 28b'),
    );
    const nonEuGround = defaultNonEuB2bServicesGround('PL', null, nonEuBusinessClient);
    expect(nonEuGround).not.toBeNull();
    expect(nonEuGround).not.toBe(euGround);
  });

  it('RO: the non-EU ground text does not contain "art. 278 alin. (2)", which roMentions pattern-matches', () => {
    const nonEuGround = defaultNonEuB2bServicesGround('RO', null, nonEuBusinessClient);
    expect(nonEuGround).not.toBeNull();
    expect(nonEuGround).not.toContain('art. 278 alin. (2)');
  });

  it('the returned ground is always one of the issuer country config own exemptionGrounds', () => {
    for (const country of ['AT', 'BG', 'CZ', 'DE', 'FR', 'IT', 'PL', 'RO']) {
      const ground = defaultNonEuB2bServicesGround(country, null, nonEuBusinessClient);
      const config = getCountryConfig(country);
      expect(ground).not.toBeNull();
      expect(config.exemptionGrounds).toContain(ground);
    }
  });
});
