import type { IssuerSnapshotDto, RecipientSnapshotDto } from '@fakturcho/shared-types';
import { residenceTypeCode, toAlpha3CountryCode } from './facturae-countries';
import { optionalTextEl, textEl } from './xml';

function taxIdOf(eik: string | null, vatNumber: string | null): string {
  if (eik) return eik;
  if (vatNumber?.toUpperCase().startsWith('ES')) return vatNumber.slice(2);
  return vatNumber ?? '';
}

function addressBlock(
  isSpain: boolean,
  street: string | null,
  postcode: string | null,
  city: string | null,
  country: string | null,
): string {
  const tag = isSpain ? 'AddressInSpain' : 'OverseasAddress';
  const provinceOrRegion = isSpain ? optionalTextEl('Province', city) : '';
  return (
    `<${tag}>` +
    optionalTextEl('Address', street) +
    optionalTextEl('PostCode', postcode) +
    optionalTextEl('Town', city) +
    provinceOrRegion +
    textEl('CountryCode', toAlpha3CountryCode(country)) +
    `</${tag}>`
  );
}

interface PartyFields {
  companyName: string | null;
  taxId: string;
  street: string | null;
  postcode: string | null;
  city: string | null;
  country: string | null;
}

function partyBlock(roleTag: 'SellerParty' | 'BuyerParty', fields: PartyFields): string {
  const isSpain = (fields.country ?? '').toUpperCase() === 'ES';
  const taxIdentification =
    '<TaxIdentification>' +
    textEl('PersonTypeCode', 'J') +
    textEl('ResidenceTypeCode', residenceTypeCode(fields.country)) +
    optionalTextEl('TaxIdentificationNumber', fields.taxId) +
    '</TaxIdentification>';
  const legalEntity =
    '<LegalEntity>' +
    optionalTextEl('CorporateName', fields.companyName) +
    addressBlock(isSpain, fields.street, fields.postcode, fields.city, fields.country) +
    '</LegalEntity>';
  return `<${roleTag}>${taxIdentification}${legalEntity}</${roleTag}>`;
}

export function sellerPartyBlock(issuer: IssuerSnapshotDto): string {
  return partyBlock('SellerParty', {
    companyName: issuer.companyName,
    taxId: taxIdOf(issuer.eik, issuer.vatNumber),
    street: issuer.street,
    postcode: issuer.postcode,
    city: issuer.city,
    country: issuer.country,
  });
}

export function buyerPartyBlock(recipient: RecipientSnapshotDto): string {
  const city = recipient.address ?? null;
  return partyBlock('BuyerParty', {
    companyName: recipient.companyName,
    taxId: taxIdOf(recipient.eik, recipient.vatNumber),
    street: recipient.street,
    postcode: recipient.postcode,
    city,
    country: recipient.country,
  });
}
