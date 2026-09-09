import type { DocumentDto } from '@fakturcho/shared-types';
import { toUblXml } from '../../einvoice/ubl-mapper';
import { isValidRomanianCui, isValidRomanianVatNumber } from './ro-cui';

const EN16931_CUSTOMIZATION_ID =
  'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0';
const PEPPOL_PROFILE_ID = 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0';

const CIUS_RO_CUSTOMIZATION_ID =
  'urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1';
const CIUS_RO_PROFILE_ID = 'urn:efactura.mfinante.ro:CIUS-RO:1.0.1';

function assertRomanianPartyIdentifiers(document: DocumentDto): void {
  if (document.issuer.country === 'RO') {
    if (document.issuer.eik && !isValidRomanianCui(document.issuer.eik)) {
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
    if (document.recipient.eik && !isValidRomanianCui(document.recipient.eik)) {
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

export function toCiusRoXml(document: DocumentDto): string {
  assertRomanianPartyIdentifiers(document);

  const baseXml = toUblXml(document);

  return baseXml
    .replace(
      `<cbc:CustomizationID>${EN16931_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
      `<cbc:CustomizationID>${CIUS_RO_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    )
    .replace(
      `<cbc:ProfileID>${PEPPOL_PROFILE_ID}</cbc:ProfileID>`,
      `<cbc:ProfileID>${CIUS_RO_PROFILE_ID}</cbc:ProfileID>`,
    );
}
