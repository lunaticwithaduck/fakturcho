import { formatDocumentNumber } from '@fakturcho/shared-types';
import { taxIdOf } from './facturae-parties';

const NO_VERIFACTU_HOST = 'www2.agenciatributaria.gob.es';
const NO_VERIFACTU_PATH = '/wlpl/TIKE-CONT/ValidarQRNoVerifactu';

function ddmmyyyy(date: Date): string {
  const iso = date.toISOString().slice(0, 10);
  const [year, month, day] = iso.split('-');
  return `${day}-${month}-${year}`;
}

function toDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export interface VerifactuQrInput {
  eik: string | null;
  vatNumber: string | null;
  numberPrefix: string | null;
  number: number | null;
  numberSuffix: string | null;
  issuedAt: Date;
  amount: number;
}

// AEAT `DetalleEspecificacTecnCodigoQRfactura.pdf` (v0.5.0) §5-6, as verified
// in AEAT.md §1.6: the QR always carries nif, numserie, fecha (DD-MM-AAAA) and
// importe (dot decimal separator). Fakturcho never submits records to AEAT
// (VerifactuTransport needs a qualified certificate this deployment does not
// configure), so every ES invoice uses the ValidarQRNoVerifactu path — the
// "VERI*FACTU" legend is reserved for systems that remit each record in real
// time (Orden HAC/1177/2024 art. 20.1.b), which is never true here.
export function buildVerifactuQrUrl(input: VerifactuQrInput): string {
  const nif = taxIdOf(input.eik, input.vatNumber);
  const numserie =
    (input.numberPrefix ?? '') +
    (input.number !== null ? formatDocumentNumber(input.number) : '') +
    (input.numberSuffix ?? '');
  const params = new URLSearchParams({
    nif,
    numserie,
    fecha: ddmmyyyy(input.issuedAt),
    importe: toDecimalString(input.amount),
  });
  return `https://${NO_VERIFACTU_HOST}${NO_VERIFACTU_PATH}?${params.toString()}`;
}
