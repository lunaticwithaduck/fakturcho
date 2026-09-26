import type { IssuerSnapshotDto, RecipientSnapshotDto } from '@fakturcho/shared-types';
import { deriveTownFromAddress } from '../../einvoice/address';
import { normalizeNip } from './nip';
import { optionalTextEl, textEl } from './xml-escape';

function addressBlock(
  street: string | null,
  cityLine: string | null,
  country: string | null,
): string {
  return (
    '<Adres>' +
    textEl('KodKraju', country ?? 'PL') +
    optionalTextEl('AdresL1', street) +
    optionalTextEl('AdresL2', cityLine) +
    '</Adres>'
  );
}

export function sellerParty(issuer: IssuerSnapshotDto): string {
  const rawNip = issuer.eik ?? issuer.vatNumber;
  const nip = rawNip ? normalizeNip(rawNip) : '';
  const cityLine = [issuer.postcode, issuer.city].filter(Boolean).join(' ') || null;
  // XSD: PrefiksPodatnika is reserved for VAT-UE-registered taxpayers (art.
  // 97 ust. 10 pkt 2 i 3 ustawy) — not every issuer.
  const prefiks = issuer.vatRegistered ? '<PrefiksPodatnika>PL</PrefiksPodatnika>' : '';
  return (
    '<Podmiot1>' +
    prefiks +
    '<DaneIdentyfikacyjne>' +
    textEl('NIP', nip) +
    optionalTextEl('Nazwa', issuer.companyName) +
    '</DaneIdentyfikacyjne>' +
    addressBlock(issuer.street, cityLine, issuer.country) +
    '</Podmiot1>'
  );
}

// Broszura informacyjna FA(3): NrVatUE is "bez literowego kodu kraju, który
// wskazano w polu KodUE" — the country prefix belongs in KodUE only.
function stripVatCountryPrefix(vatNumber: string, country: string): string {
  return vatNumber.toUpperCase().startsWith(country.toUpperCase())
    ? vatNumber.slice(country.length)
    : vatNumber;
}

function buyerIdentityBlock(recipient: RecipientSnapshotDto): string {
  const rawVat = recipient.vatNumber;
  const domesticNip = recipient.eik ?? rawVat;
  if (recipient.country === 'PL' && domesticNip) {
    return textEl('NIP', normalizeNip(domesticNip));
  }
  if (recipient.country && recipient.country !== 'PL' && rawVat) {
    return (
      textEl('KodUE', recipient.country) +
      textEl('NrVatUE', stripVatCountryPrefix(rawVat, recipient.country))
    );
  }
  if (recipient.country && recipient.country !== 'PL' && !rawVat) {
    const nrId = recipient.eik ?? recipient.companyName ?? '';
    return textEl('KodKraju', recipient.country) + optionalTextEl('NrID', nrId);
  }
  return '<BrakID>1</BrakID>';
}

export function buyerParty(recipient: RecipientSnapshotDto): string {
  const cityLine =
    [recipient.postcode, recipient.city].filter(Boolean).join(' ') ||
    deriveTownFromAddress(recipient.address);
  return (
    '<Podmiot2>' +
    '<DaneIdentyfikacyjne>' +
    buyerIdentityBlock(recipient) +
    optionalTextEl('Nazwa', recipient.companyName) +
    '</DaneIdentyfikacyjne>' +
    addressBlock(recipient.street, cityLine, recipient.country) +
    (recipient.email
      ? `<DaneKontaktowe>${textEl('Email', recipient.email)}</DaneKontaktowe>`
      : '') +
    textEl('JST', '2') +
    textEl('GV', '2') +
    '</Podmiot2>'
  );
}
