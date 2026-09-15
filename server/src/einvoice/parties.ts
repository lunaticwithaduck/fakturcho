import type { IssuerSnapshotDto, RecipientSnapshotDto } from '@fakturcho/shared-types';
import { optionalTextEl, textEl } from './xml';

export function supplierParty(issuer: IssuerSnapshotDto): string {
  const address =
    optionalTextEl('cbc:StreetName', issuer.street) +
    optionalTextEl('cbc:CityName', issuer.city) +
    optionalTextEl('cbc:PostalZone', issuer.postcode) +
    (issuer.country
      ? `<cac:Country>${textEl('cbc:IdentificationCode', issuer.country)}</cac:Country>`
      : '');
  const taxScheme = issuer.vatNumber
    ? `<cac:PartyTaxScheme>${textEl('cbc:CompanyID', issuer.vatNumber)}` +
      `<cac:TaxScheme>${textEl('cbc:ID', 'VAT')}</cac:TaxScheme></cac:PartyTaxScheme>`
    : '';
  const legalEntity =
    `<cac:PartyLegalEntity>${optionalTextEl('cbc:RegistrationName', issuer.companyName)}` +
    `${optionalTextEl('cbc:CompanyID', issuer.eik)}</cac:PartyLegalEntity>`;
  const contact = issuer.phone
    ? `<cac:Contact>${textEl('cbc:Telephone', issuer.phone)}</cac:Contact>`
    : '';
  return (
    '<cac:AccountingSupplierParty><cac:Party>' +
    `<cac:PostalAddress>${address}</cac:PostalAddress>${taxScheme}${legalEntity}${contact}` +
    '</cac:Party></cac:AccountingSupplierParty>'
  );
}

export function customerParty(recipient: RecipientSnapshotDto): string {
  const addressLine = recipient.address
    ? `<cac:AddressLine>${textEl('cbc:Line', recipient.address)}</cac:AddressLine>`
    : '';
  const address =
    optionalTextEl('cbc:StreetName', recipient.street) +
    optionalTextEl('cbc:CityName', recipient.city) +
    optionalTextEl('cbc:PostalZone', recipient.postcode) +
    addressLine +
    (recipient.country
      ? `<cac:Country>${textEl('cbc:IdentificationCode', recipient.country)}</cac:Country>`
      : '');
  const taxScheme = recipient.vatNumber
    ? `<cac:PartyTaxScheme>${textEl('cbc:CompanyID', recipient.vatNumber)}` +
      `<cac:TaxScheme>${textEl('cbc:ID', 'VAT')}</cac:TaxScheme></cac:PartyTaxScheme>`
    : '';
  const legalEntity =
    `<cac:PartyLegalEntity>${optionalTextEl('cbc:RegistrationName', recipient.companyName)}` +
    `${optionalTextEl('cbc:CompanyID', recipient.eik)}</cac:PartyLegalEntity>`;
  const contact = recipient.email
    ? `<cac:Contact>${textEl('cbc:ElectronicMail', recipient.email)}</cac:Contact>`
    : '';
  return (
    '<cac:AccountingCustomerParty><cac:Party>' +
    `<cac:PostalAddress>${address}</cac:PostalAddress>${taxScheme}${legalEntity}${contact}` +
    '</cac:Party></cac:AccountingCustomerParty>'
  );
}
