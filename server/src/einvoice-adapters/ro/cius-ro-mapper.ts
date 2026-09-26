import type { DocumentDto } from '@fakturcho/shared-types';
import { AE_VATEX_REASON_TEXT } from '../../einvoice/monetary';
import { toUblXml } from '../../einvoice/ubl-mapper';
import { escapeXml } from '../../einvoice/xml';
import { toRoSubdivisionCode } from './ro-counties';
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

// CIUS-RO requires the country subdivision (BT-39/BT-54) in ISO 3166-2:RO
// form, e.g. "RO-CJ" for Cluj or "RO-B" for Bucharest. Only applies to a party
// established in Romania; an unrecognised value passes through unchanged so
// ANAF's validator reports it rather than us guessing.
function toIso31662RoSubentity(countyRegion: string, partyCountry: string | null): string {
  if (partyCountry !== 'RO') return countyRegion;
  return toRoSubdivisionCode(countyRegion) ?? countyRegion;
}

function withCountrySubentity(
  partySegment: string,
  countyRegion: string | undefined,
  partyCountry: string | null,
): string {
  if (!countyRegion) return partySegment;
  const subentity = toIso31662RoSubentity(countyRegion, partyCountry);
  const withSubentity = partySegment.replace(
    '<cac:Country>',
    `<cbc:CountrySubentity>${escapeXml(subentity)}</cbc:CountrySubentity><cac:Country>`,
  );
  return subentity === 'RO-B' ? withBucharestSectorCity(withSubentity) : withSubentity;
}

// BR-RO-100: a Bucharest address (RO-B) must name its sector as the city,
// SECTOR1..SECTOR6. The sector is read from the city or street the user typed;
// without one the city is left as entered.
function withBucharestSectorCity(partySegment: string): string {
  const address = partySegment.slice(0, partySegment.indexOf('<cac:Country>'));
  const sector = address.match(/sector(?:ul)?\s*([1-6])(?![0-9])/iu)?.[1];
  if (!sector) return partySegment;
  return partySegment.replace(
    /<cbc:CityName>[^<]*<\/cbc:CityName>/u,
    `<cbc:CityName>SECTOR${sector}</cbc:CityName>`,
  );
}

// CIUS-RO keeps the RO-prefixed CIF for the VAT identifier (PartyTaxScheme/
// CompanyID, BT-31/BT-48) but wants the bare CUI for the legal registration
// identifier (PartyLegalEntity/CompanyID, BT-30/BT-47) regardless of VAT
// registration — see the rule table in https://github.com/atlasflow/efactura-ro.
function withBareCuiInLegalEntity(
  partySegment: string,
  partyCountry: string | null,
  eik: string | null,
): string {
  if (partyCountry !== 'RO' || !eik) return partySegment;
  const bareCui = extractRomanianCui(eik);
  if (bareCui === eik) return partySegment;
  return partySegment.replace(
    `<cbc:CompanyID>${escapeXml(eik)}</cbc:CompanyID></cac:PartyLegalEntity>`,
    `<cbc:CompanyID>${escapeXml(bareCui)}</cbc:CompanyID></cac:PartyLegalEntity>`,
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
  const supplierSegment = withBareCuiInLegalEntity(
    rebrandedXml.slice(0, customerPartyIndex),
    document.issuer.country,
    document.issuer.eik,
  );
  const customerSegment = withBareCuiInLegalEntity(
    rebrandedXml.slice(customerPartyIndex),
    document.recipient.country,
    document.recipient.eik,
  );

  return (
    withCountrySubentity(supplierSegment, options.issuerCountyRegion, document.issuer.country) +
    withCountrySubentity(customerSegment, options.recipientCountyRegion, document.recipient.country)
  );
}
