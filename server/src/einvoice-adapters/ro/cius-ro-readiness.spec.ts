import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { roDomesticStandardInvoice } from './__fixtures__/ro-domestic-standard';
import { checkCiusRoReadiness } from './cius-ro-readiness';

describe('checkCiusRoReadiness — fully populated RO fixture', () => {
  it('flags both counties as missing when no options are supplied', () => {
    expect(checkCiusRoReadiness(roDomesticStandardInvoice)).toEqual({
      ready: false,
      missingFields: [
        'issuer county/județ (CIUS-RO CountrySubentity)',
        'recipient county/județ (CIUS-RO CountrySubentity)',
      ],
    });
  });

  it('is ready once both counties are supplied via options', () => {
    expect(
      checkCiusRoReadiness(roDomesticStandardInvoice, {
        issuerCountyRegion: 'București',
        recipientCountyRegion: 'Cluj',
      }),
    ).toEqual({
      ready: true,
      missingFields: [],
    });
  });

  it('still flags the recipient county when only the issuer county is supplied', () => {
    const result = checkCiusRoReadiness(roDomesticStandardInvoice, {
      issuerCountyRegion: 'București',
    });
    expect(result.missingFields).toEqual(['recipient county/județ (CIUS-RO CountrySubentity)']);
  });
});

describe('checkCiusRoReadiness — inherits core EN 16931 checks', () => {
  it('flags an unissued document', () => {
    const draft: DocumentDto = {
      ...roDomesticStandardInvoice,
      number: null,
      issuedAt: null,
    };
    expect(checkCiusRoReadiness(draft).missingFields).toContain(
      'document number (document must be issued)',
    );
  });
});

describe('checkCiusRoReadiness — Romanian CUI checks', () => {
  it('flags a missing issuer CUI', () => {
    const incomplete: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, eik: null },
    };
    expect(checkCiusRoReadiness(incomplete).missingFields).toContain(
      'issuer CUI (Romanian tax registration code, required by CIUS-RO)',
    );
  });

  it('flags an issuer CUI that fails the checksum', () => {
    const incomplete: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, eik: '18547291' },
    };
    expect(checkCiusRoReadiness(incomplete).missingFields).toContain(
      'issuer CUI fails the Romanian checksum (CIUS-RO)',
    );
  });

  it('flags a missing issuer VAT number when VAT-registered', () => {
    const incomplete: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, vatNumber: null },
    };
    expect(checkCiusRoReadiness(incomplete).missingFields).toContain(
      'issuer RO VAT number (CIUS-RO requires the RO prefix)',
    );
  });

  it('flags an issuer VAT number missing the RO prefix', () => {
    const incomplete: DocumentDto = {
      ...roDomesticStandardInvoice,
      issuer: { ...roDomesticStandardInvoice.issuer, vatNumber: '18547290' },
    };
    expect(checkCiusRoReadiness(incomplete).missingFields).toContain(
      'issuer VAT number is not a valid RO-prefixed CUI (CIUS-RO)',
    );
  });

  it('flags a missing recipient CUI', () => {
    const incomplete: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: { ...roDomesticStandardInvoice.recipient, eik: null },
    };
    expect(checkCiusRoReadiness(incomplete).missingFields).toContain(
      'recipient CUI (Romanian tax registration code, required by CIUS-RO)',
    );
  });

  it('flags a recipient VAT number that fails the checksum', () => {
    const incomplete: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: { ...roDomesticStandardInvoice.recipient, vatNumber: 'RO14399841' },
    };
    expect(checkCiusRoReadiness(incomplete).missingFields).toContain(
      'recipient VAT number is not a valid RO-prefixed CUI (CIUS-RO)',
    );
  });

  it('does not apply Romanian CUI checks to a non-Romanian party', () => {
    const notRomanian: DocumentDto = {
      ...roDomesticStandardInvoice,
      recipient: {
        ...roDomesticStandardInvoice.recipient,
        country: 'DE',
        vatNumber: 'DE123456789',
        eik: 'HRB 654321',
      },
    };
    const result = checkCiusRoReadiness(notRomanian, { issuerCountyRegion: 'București' });
    expect(result.missingFields.some((field) => field.includes('CUI'))).toBe(false);
    expect(result.missingFields.some((field) => field.includes('county'))).toBe(false);
  });
});
