import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { EINVOICE_MISSING_FIELD_CODES } from '../../einvoice/readiness';
import { frDomesticStandardInvoice } from './__fixtures__/fr-domestic-standard';
import { checkFrenchEinvoiceReadiness } from './fr-readiness';

describe('checkFrenchEinvoiceReadiness — fully populated FR domestic fixture', () => {
  it('is ready', () => {
    expect(checkFrenchEinvoiceReadiness(frDomesticStandardInvoice)).toEqual({
      ready: true,
      missingFields: [],
    });
  });
});

describe('checkFrenchEinvoiceReadiness — French identifier checks', () => {
  it('flags a missing valid SIREN/SIRET on an FR issuer', () => {
    const incomplete: DocumentDto = {
      ...frDomesticStandardInvoice,
      issuer: { ...frDomesticStandardInvoice.issuer, eik: null },
    };
    const result = checkFrenchEinvoiceReadiness(incomplete);
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.issuerSirenOrSiret);
  });

  it('flags an invalid SIREN/SIRET checksum on an FR recipient', () => {
    const incomplete: DocumentDto = {
      ...frDomesticStandardInvoice,
      recipient: { ...frDomesticStandardInvoice.recipient, eik: '394426002' },
    };
    const result = checkFrenchEinvoiceReadiness(incomplete);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.recipientSirenOrSiret);
  });

  it('flags an FR VAT number that does not match FR + 11 characters', () => {
    const incomplete: DocumentDto = {
      ...frDomesticStandardInvoice,
      issuer: { ...frDomesticStandardInvoice.issuer, vatNumber: 'FR123' },
    };
    const result = checkFrenchEinvoiceReadiness(incomplete);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.issuerVatNumberFrFormat);
  });

  it('does not require SIREN/SIRET from a non-FR party', () => {
    const crossBorder: DocumentDto = {
      ...frDomesticStandardInvoice,
      recipient: {
        ...frDomesticStandardInvoice.recipient,
        country: 'DE',
        eik: null,
        vatNumber: 'DE123456789',
      },
    };
    const result = checkFrenchEinvoiceReadiness(crossBorder);
    expect(result.missingFields).not.toContain(EINVOICE_MISSING_FIELD_CODES.recipientSirenOrSiret);
  });

  it('still surfaces core readiness gaps alongside FR-specific ones', () => {
    const incomplete: DocumentDto = {
      ...frDomesticStandardInvoice,
      issuer: { ...frDomesticStandardInvoice.issuer, street: null, eik: null },
    };
    const result = checkFrenchEinvoiceReadiness(incomplete);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.issuerStreet);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.issuerSirenOrSiret);
  });
});
