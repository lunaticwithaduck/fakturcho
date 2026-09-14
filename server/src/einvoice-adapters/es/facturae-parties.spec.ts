import { describe, expect, it } from 'vitest';
import { esDomesticStandardInvoice } from './__fixtures__/es-domestic-standard';
import { buyerPartyBlock, sellerPartyBlock, taxIdOf } from './facturae-parties';

describe('taxIdOf', () => {
  it('prefers eik over vatNumber', () => {
    expect(taxIdOf('B12345674', 'ESB12345674')).toBe('B12345674');
  });

  it('strips the ES prefix from vatNumber when eik is absent', () => {
    expect(taxIdOf(null, 'ESB12345674')).toBe('B12345674');
  });

  it('falls back to an empty string when neither is present', () => {
    expect(taxIdOf(null, null)).toBe('');
  });
});

describe('buyerPartyBlock — AdministrativeCentres', () => {
  it('omits AdministrativeCentres for an ordinary buyerReference', () => {
    const xml = buyerPartyBlock(esDomesticStandardInvoice);
    expect(xml).not.toContain('AdministrativeCentres');
  });

  it('carries the DIR3 codes as AdministrativeCentres for a public-body buyerReference', () => {
    const xml = buyerPartyBlock({
      ...esDomesticStandardInvoice,
      buyerReference: 'DIR3:L01280796:GE0003782:GE0003783',
    });
    expect(xml).toContain(
      '<AdministrativeCentres>' +
        '<AdministrativeCentre><CentreCode>L01280796</CentreCode><RoleTypeCode>02</RoleTypeCode></AdministrativeCentre>' +
        '<AdministrativeCentre><CentreCode>GE0003782</CentreCode><RoleTypeCode>03</RoleTypeCode></AdministrativeCentre>' +
        '<AdministrativeCentre><CentreCode>GE0003783</CentreCode><RoleTypeCode>01</RoleTypeCode></AdministrativeCentre>' +
        '</AdministrativeCentres>',
    );
  });
});

describe('sellerPartyBlock', () => {
  it('never carries AdministrativeCentres — DIR3 only applies to the buyer', () => {
    const xml = sellerPartyBlock(esDomesticStandardInvoice.issuer);
    expect(xml).not.toContain('AdministrativeCentres');
  });
});

describe('buyerPartyBlock — AddressInSpain', () => {
  it('uses the structured city for Town and countyRegion for Province', () => {
    const xml = buyerPartyBlock({
      ...esDomesticStandardInvoice,
      recipient: {
        ...esDomesticStandardInvoice.recipient,
        address: 'Some legacy free-text line',
        city: 'Bilbao',
        countyRegion: 'Vizcaya',
      },
    });
    expect(xml).toContain('<Town>Bilbao</Town>');
    expect(xml).toContain('<Province>Vizcaya</Province>');
    expect(xml).not.toContain('Some legacy free-text line');
  });

  it('falls back to the free-text address for Town when city is missing', () => {
    const xml = buyerPartyBlock({
      ...esDomesticStandardInvoice,
      recipient: { ...esDomesticStandardInvoice.recipient, address: 'Valencia', city: null },
    });
    expect(xml).toContain('<Town>Valencia</Town>');
  });
});
