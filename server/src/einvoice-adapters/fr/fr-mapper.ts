import type { DocumentDto } from '@fakturcho/shared-types';
import { toUblXml } from '../../einvoice/ubl-mapper';
import { escapeXml } from '../../einvoice/xml';
import { isValidFrenchVatNumber, resolveFrenchBusinessIdentifier } from './fr-identifiers';

export class FrenchMappingError extends Error {}

function checkFrenchBusinessIdentifier(eik: string | null, role: 'issuer' | 'recipient'): string[] {
  if (resolveFrenchBusinessIdentifier(eik) !== null) return [];
  return [`${role} business identifier must be a valid SIREN (9 digits) or SIRET (14 digits)`];
}

function checkFrenchVatNumber(vatNumber: string | null, role: 'issuer' | 'recipient'): string[] {
  if (vatNumber === null || isValidFrenchVatNumber(vatNumber)) return [];
  return [`${role} VAT number must be "FR" followed by 11 characters`];
}

function partyIdentificationBlock(eik: string | null): string {
  const identifier = resolveFrenchBusinessIdentifier(eik);
  if (identifier === null) return '';
  return `<cac:PartyIdentification><cbc:ID schemeID="${identifier.schemeId}">${escapeXml(identifier.value)}</cbc:ID></cac:PartyIdentification>`;
}

export function toFrenchUblXml(document: DocumentDto): string {
  const errors = [
    ...(document.issuer.country === 'FR'
      ? [
          ...checkFrenchBusinessIdentifier(document.issuer.eik, 'issuer'),
          ...checkFrenchVatNumber(document.issuer.vatNumber, 'issuer'),
        ]
      : []),
    ...(document.recipient.country === 'FR'
      ? [
          ...checkFrenchBusinessIdentifier(document.recipient.eik, 'recipient'),
          ...checkFrenchVatNumber(document.recipient.vatNumber, 'recipient'),
        ]
      : []),
  ];
  if (errors.length > 0) throw new FrenchMappingError(errors.join('; '));

  let xml = toUblXml(document);

  if (document.issuer.country === 'FR') {
    const block = partyIdentificationBlock(document.issuer.eik);
    if (block !== '') {
      xml = xml.replace(
        '<cac:AccountingSupplierParty><cac:Party>',
        `<cac:AccountingSupplierParty><cac:Party>${block}`,
      );
    }
  }
  if (document.recipient.country === 'FR') {
    const block = partyIdentificationBlock(document.recipient.eik);
    if (block !== '') {
      xml = xml.replace(
        '<cac:AccountingCustomerParty><cac:Party>',
        `<cac:AccountingCustomerParty><cac:Party>${block}`,
      );
    }
  }

  return xml;
}
