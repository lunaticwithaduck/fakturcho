import type { IssuerSnapshotDto, RecipientSnapshotDto } from '@fakturcho/shared-types';
import { el, optionalEl } from './xml';

const COUNTRY_PREFIX_PATTERN = /^[A-Z]{2}/;

function vatDigits(vatNumber: string): string {
  return COUNTRY_PREFIX_PATTERN.test(vatNumber) ? vatNumber.slice(2) : vatNumber;
}

function vatCountry(vatNumber: string): string {
  const match = COUNTRY_PREFIX_PATTERN.exec(vatNumber);
  return match ? match[0] : 'IT';
}

function idFiscaleIvaBlock(vatNumber: string | null): string {
  if (!vatNumber) return '';
  return `<IdFiscaleIVA>${el('IdPaese', vatCountry(vatNumber))}${el('IdCodice', vatDigits(vatNumber))}</IdFiscaleIVA>`;
}

function cityFromAddressLine(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(',');
  const last = parts[parts.length - 1]?.trim();
  return last && last.length > 0 ? last : null;
}

export function cedentePrestatoreBlock(issuer: IssuerSnapshotDto): string {
  const datiAnagrafici =
    '<DatiAnagrafici>' +
    idFiscaleIvaBlock(issuer.vatNumber) +
    optionalEl('CodiceFiscale', issuer.eik) +
    `<Anagrafica>${optionalEl('Denominazione', issuer.companyName)}</Anagrafica>` +
    el('RegimeFiscale', 'RF01') +
    '</DatiAnagrafici>';
  const sede =
    '<Sede>' +
    optionalEl('Indirizzo', issuer.street) +
    optionalEl('CAP', issuer.postcode) +
    optionalEl('Comune', issuer.city) +
    optionalEl('Nazione', issuer.country) +
    '</Sede>';
  return `<CedentePrestatore>${datiAnagrafici}${sede}</CedentePrestatore>`;
}

export function cessionarioCommittenteBlock(recipient: RecipientSnapshotDto): string {
  const datiAnagrafici =
    '<DatiAnagrafici>' +
    idFiscaleIvaBlock(recipient.vatNumber) +
    optionalEl('CodiceFiscale', recipient.eik) +
    `<Anagrafica>${optionalEl('Denominazione', recipient.companyName)}</Anagrafica>` +
    '</DatiAnagrafici>';
  const sede =
    '<Sede>' +
    optionalEl('Indirizzo', recipient.street) +
    optionalEl('CAP', recipient.postcode) +
    optionalEl('Comune', cityFromAddressLine(recipient.address)) +
    optionalEl('Nazione', recipient.country) +
    '</Sede>';
  return `<CessionarioCommittente>${datiAnagrafici}${sede}</CessionarioCommittente>`;
}
