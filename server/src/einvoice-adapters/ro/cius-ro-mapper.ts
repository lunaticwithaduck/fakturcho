import type { DocumentDto } from '@fakturcho/shared-types';
import { AE_VATEX_REASON_TEXT } from '../../einvoice/monetary';
import { toUblXml } from '../../einvoice/ubl-mapper';
import { escapeXml } from '../../einvoice/xml';
import { extractRomanianCui, isValidRomanianCui, isValidRomanianVatNumber } from './ro-cui';

// Codul fiscal art. 319 alin. (20) lit. m) requires the actual words "taxare
// inversă" to appear on the invoice for a reverse-charge line (see
// mentions/ro.ts, which does the same for the PDF); the shared UBL mapper
// only knows the EN16931/VATEX code list's English wording, so CIUS-RO swaps
// it in wherever that generic fallback was used.
const RO_REVERSE_CHARGE_REASON_TEXT = 'Taxare inversă';

const EN16931_CUSTOMIZATION_ID =
  'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0';
const PEPPOL_PROFILE_ID = 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0';

const CIUS_RO_CUSTOMIZATION_ID =
  'urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1';
const CIUS_RO_PROFILE_ID = 'urn:efactura.mfinante.ro:CIUS-RO:1.0.1';

const ACCOUNTING_CUSTOMER_PARTY_TAG = '<cac:AccountingCustomerParty>';

export interface ToCiusRoXmlOptions {
  issuerCountyRegion?: string;
  recipientCountyRegion?: string;
}

// A VAT-registered issuer's CUI field commonly carries the same RO-prefixed
// value as its VAT number (that is what appears on its ANAF registration —
// see footer-blocks.ts, which prints it as-is for that case); the CUI
// checksum itself is only defined over the bare digits, so it must be
// extracted before validating, the same way anaf-transport.ts already does
// for the upload URL's cif parameter.
function assertRomanianPartyIdentifiers(document: DocumentDto): void {
  if (document.issuer.country === 'RO') {
    if (document.issuer.eik && !isValidRomanianCui(extractRomanianCui(document.issuer.eik))) {
      throw new Error(
        `toCiusRoXml: issuer registration identifier "${document.issuer.eik}" is not a valid Romanian CUI.`,
      );
    }
    if (document.issuer.vatRegistered && document.issuer.vatNumber) {
      if (!isValidRomanianVatNumber(document.issuer.vatNumber)) {
        throw new Error(
          `toCiusRoXml: issuer VAT number "${document.issuer.vatNumber}" is not a valid RO-prefixed CUI.`,
        );
      }
    }
  }

  if (document.recipient.country === 'RO') {
    if (document.recipient.eik && !isValidRomanianCui(extractRomanianCui(document.recipient.eik))) {
      throw new Error(
        `toCiusRoXml: recipient registration identifier "${document.recipient.eik}" is not a valid Romanian CUI.`,
      );
    }
    if (document.recipient.vatNumber && !isValidRomanianVatNumber(document.recipient.vatNumber)) {
      throw new Error(
        `toCiusRoXml: recipient VAT number "${document.recipient.vatNumber}" is not a valid RO-prefixed CUI.`,
      );
    }
  }
}

function withCountrySubentity(partySegment: string, countyRegion: string | undefined): string {
  if (!countyRegion) return partySegment;
  return partySegment.replace(
    '<cac:Country>',
    `<cbc:CountrySubentity>${escapeXml(countyRegion)}</cbc:CountrySubentity><cac:Country>`,
  );
}

export function toCiusRoXml(document: DocumentDto, options: ToCiusRoXmlOptions = {}): string {
  assertRomanianPartyIdentifiers(document);

  const baseXml = toUblXml(document);

  const rebrandedXml = baseXml
    .replace(
      `<cbc:CustomizationID>${EN16931_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
      `<cbc:CustomizationID>${CIUS_RO_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    )
    .replace(
      `<cbc:ProfileID>${PEPPOL_PROFILE_ID}</cbc:ProfileID>`,
      `<cbc:ProfileID>${CIUS_RO_PROFILE_ID}</cbc:ProfileID>`,
    )
    .replaceAll(
      `<cbc:TaxExemptionReason>${AE_VATEX_REASON_TEXT}</cbc:TaxExemptionReason>`,
      `<cbc:TaxExemptionReason>${RO_REVERSE_CHARGE_REASON_TEXT}</cbc:TaxExemptionReason>`,
    );

  const customerPartyIndex = rebrandedXml.indexOf(ACCOUNTING_CUSTOMER_PARTY_TAG);
  const supplierSegment = rebrandedXml.slice(0, customerPartyIndex);
  const customerSegment = rebrandedXml.slice(customerPartyIndex);

  return (
    withCountrySubentity(supplierSegment, options.issuerCountyRegion) +
    withCountrySubentity(customerSegment, options.recipientCountyRegion)
  );
}
