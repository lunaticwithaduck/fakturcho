import { createHash } from 'node:crypto';
import type { DocumentDto } from '@fakturcho/shared-types';
import { normalizeNip } from './nip';

const KOD_I_HOST = 'qr.ksef.mf.gov.pl';

function ddmmyyyy(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}-${month}-${year}`;
}

export function hashFa3Xml(xml: string): string {
  return createHash('sha256').update(xml, 'utf8').digest('base64url');
}

// KSeF 2.0 "KOD I" visualisation QR: CIRFMF/ksef-api `kody-qr.md` —
// https://qr.ksef.mf.gov.pl/invoice/{NIP}/{DD-MM-RRRR}/{SHA-256 of the FA(3)
// XML file, Base64URL}. Points at the production verification host: this is
// the QR a real customer scans, independent of any KSEF_ENVIRONMENT the
// (unused) submission transport is configured for.
export function buildKodIUrl(document: DocumentDto, xml: string): string {
  const rawNip = document.issuer.eik ?? document.issuer.vatNumber;
  const nip = rawNip ? normalizeNip(rawNip) : '';
  const date = document.issuedAt ? ddmmyyyy(document.issuedAt) : '';
  const hash = hashFa3Xml(xml);
  return `https://${KOD_I_HOST}/invoice/${nip}/${date}/${hash}`;
}
