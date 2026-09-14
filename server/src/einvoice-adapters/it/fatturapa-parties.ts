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

const REA_PATTERN = /^([A-Z]{2})-(\d{1,7})$/;

function parseItalianAmount(value: string): string | null {
  const match = value.match(/[\d.,]+/);
  if (!match) return null;
  const normalized = match[0].replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount.toFixed(2) : null;
}

function iscrizioneReaBlock(identifiers: Record<string, string>): string {
  const rea = identifiers.rea?.match(REA_PATTERN);
  const ufficio = rea?.[1];
  const numeroRea = rea?.[2];
  if (!ufficio || !numeroRea) return '';
  const capitaleSociale = identifiers.shareCapital
    ? parseItalianAmount(identifiers.shareCapital)
    : null;
  return (
    '<IscrizioneREA>' +
    el('Ufficio', ufficio) +
    el('NumeroREA', numeroRea) +
    (capitaleSociale ? el('CapitaleSociale', capitaleSociale) : '') +
    el('StatoLiquidazione', 'LN') +
    '</IscrizioneREA>'
  );
}

export function cedentePrestatoreBlock(issuer: IssuerSnapshotDto): string {
  const datiAnagrafici =
    '<DatiAnagrafici>' +
    idFiscaleIvaBlock(issuer.vatNumber) +
    optionalEl('CodiceFiscale', issuer.eik) +
    `<Anagrafica>${optionalEl('Denominazione', issuer.companyName)}</Anagrafica>` +
    el('RegimeFiscale', issuer.vatRegistered === false ? 'RF19' : 'RF01') +
    '</DatiAnagrafici>';
  const sede =
    '<Sede>' +
    optionalEl('Indirizzo', issuer.street) +
    optionalEl('CAP', issuer.postcode) +
    optionalEl('Comune', issuer.city) +
    optionalEl('Nazione', issuer.country) +
    '</Sede>';
  return `<CedentePrestatore>${datiAnagrafici}${sede}${iscrizioneReaBlock(issuer.identifiers)}</CedentePrestatore>`;
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
