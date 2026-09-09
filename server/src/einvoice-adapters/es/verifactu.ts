import type { DocumentDto } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';

export interface VerifactuReportResult {
  status: 'accepted' | 'rejected';
  verifactuId?: string;
  qrCode?: string;
  errorText?: string;
}

export interface VerifactuReporter {
  readonly providerName: string;
  reportInvoice(document: DocumentDto): Promise<VerifactuReportResult>;
}

export const VERIFACTU_REPORTER = Symbol('VERIFACTU_REPORTER');

const AEAT_QR_BASE_URL = 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR';

function ddmmyyyy(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function deterministicHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function invoiceSeries(document: DocumentDto): string {
  const documentNumber = document.number !== null ? formatDocumentNumber(document.number) : '';
  return `${document.numberPrefix ?? ''}${documentNumber}${document.numberSuffix ?? ''}`;
}

@Injectable()
export class MockVerifactuReporter implements VerifactuReporter {
  readonly providerName = 'mock-verifactu';

  async reportInvoice(document: DocumentDto): Promise<VerifactuReportResult> {
    const nif = document.issuer.eik;
    const series = invoiceSeries(document);

    if (!nif || !series || document.issuedAt === null) {
      return {
        status: 'rejected',
        errorText:
          'document is missing the issuer NIF, invoice number or issue date required for Verifactu reporting',
      };
    }

    const importe = (document.amount / 100).toFixed(2);
    const fecha = ddmmyyyy(document.issuedAt);
    const seed = `${nif}|${series}|${fecha}|${importe}`;
    const hash = deterministicHash(seed);
    const verifactuId = `VERI-${hash.toUpperCase()}`;
    const qrCode =
      `${AEAT_QR_BASE_URL}?nif=${encodeURIComponent(nif)}` +
      `&numserie=${encodeURIComponent(series)}` +
      `&fecha=${encodeURIComponent(fecha)}` +
      `&importe=${encodeURIComponent(importe)}`;

    return { status: 'accepted', verifactuId, qrCode };
  }
}
