import type { IssuerSnapshotDto, RecipientSnapshotDto } from '@fakturcho/shared-types';
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
  return (
    '<Podmiot1>' +
    '<PrefiksPodatnika>PL</PrefiksPodatnika>' +
    '<DaneIdentyfikacyjne>' +
    textEl('NIP', nip) +
    optionalTextEl('Nazwa', issuer.companyName) +
    '</DaneIdentyfikacyjne>' +
    addressBlock(issuer.street, cityLine, issuer.country) +
    '</Podmiot1>'
  );
}

function buyerIdentityBlock(recipient: RecipientSnapshotDto): string {
  const rawVat = recipient.vatNumber;
  const domesticNip = recipient.eik ?? rawVat;
  if (recipient.country === 'PL' && domesticNip) {
    return textEl('NIP', normalizeNip(domesticNip));
  }
  if (recipient.country && recipient.country !== 'PL' && rawVat) {
    return textEl('KodUE', recipient.country) + textEl('NrVatUE', rawVat);
  }
  if (recipient.country && recipient.country !== 'PL' && !rawVat) {
    const nrId = recipient.eik ?? recipient.companyName ?? '';
    return textEl('KodKraju', recipient.country) + optionalTextEl('NrID', nrId);
  }
  return '<BrakID>1</BrakID>';
}

export function buyerParty(recipient: RecipientSnapshotDto): string {
  const cityLine =
    [recipient.postcode, recipient.city].filter(Boolean).join(' ') || recipient.address;
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
    '</Podmiot2>'
  );
}
