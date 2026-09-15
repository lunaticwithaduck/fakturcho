import * as https from 'node:https';
import { URL } from 'node:url';
import { Injectable } from '@nestjs/common';
import type {
  EinvoiceTransport,
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { el } from './xml';

type SdiEnvironment = 'test' | 'prod';

interface SdiConfig {
  environment: SdiEnvironment;
  cert: string;
  key: string;
  ca: string;
  senderVat: string;
}

const ENDPOINTS: Record<SdiEnvironment, string> = {
  test: 'https://testservizi.fatturapa.it/ricevi_file',
  prod: 'https://servizi.fatturapa.it/ricevi_file',
};

const SOAP_ACTION = 'http://www.fatturapa.it/SdIRiceviFile/RiceviFile';
const TYPES_NAMESPACE = 'http://www.fatturapa.gov.it/sdi/ws/trasmissione/v1.0/types';

const COUNTRY_PREFIX_PATTERN = /^[A-Z]{2}/;

// DM 55/2013 Allegato B §2.2: EI01 file allegato vuoto, EI02 servizio
// momentaneamente non disponibile, EI03 utente non abilitato.
const SDI_ERROR_DESCRIPTIONS: Record<string, string> = {
  EI01: 'file allegato vuoto',
  EI02: 'servizio momentaneamente non disponibile',
  EI03: 'utente non abilitato',
};

function decodePem(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes('-----BEGIN')) return trimmed.replace(/\\n/g, '\n');
  return Buffer.from(trimmed, 'base64').toString('utf8');
}

function readSdiConfig(): SdiConfig | null {
  const environment = process.env.SDI_ENVIRONMENT;
  const clientCert = process.env.SDI_CLIENT_CERT_PEM;
  const clientKey = process.env.SDI_CLIENT_KEY_PEM;
  const ca = process.env.SDI_CA_PEM;
  const senderVat = process.env.SDI_SENDER_VAT;
  if (
    (environment !== 'test' && environment !== 'prod') ||
    !clientCert ||
    !clientKey ||
    !ca ||
    !senderVat
  ) {
    return null;
  }
  return {
    environment,
    cert: decodePem(clientCert),
    key: decodePem(clientKey),
    ca: decodePem(ca),
    senderVat,
  };
}

// DM 55/2013 Allegato B §2.2: <IdPaese><IdCodice>_<progressivo>.xml, progressivo
// max 5 alphanumeric chars, only needs to be unique per transmitter.
function progressivoFromDocumentId(documentId: string): string {
  const sanitized = documentId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return sanitized.slice(-5).padStart(5, '0');
}

function buildFileName(senderVat: string, documentId: string): string {
  const digits = COUNTRY_PREFIX_PATTERN.test(senderVat) ? senderVat.slice(2) : senderVat;
  return `IT${digits}_${progressivoFromDocumentId(documentId)}.xml`;
}

function buildRiceviFileEnvelope(fileName: string, xmlBase64: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ' +
    `xmlns:tns="${TYPES_NAMESPACE}">` +
    '<soapenv:Body>' +
    '<tns:fileSdIAccoglienza>' +
    el('tns:NomeFile', fileName) +
    `<tns:File>${xmlBase64}</tns:File>` +
    '</tns:fileSdIAccoglienza>' +
    '</soapenv:Body>' +
    '</soapenv:Envelope>'
  );
}

function extractTag(body: string, tag: string): string | null {
  const match = new RegExp(`<(?:[\\w.-]+:)?${tag}>([\\s\\S]*?)</(?:[\\w.-]+:)?${tag}>`).exec(body);
  return match?.[1]?.trim() ?? null;
}

function postRiceviFile(url: string, envelope: string, config: SdiConfig): Promise<string> {
  const target = new URL(url);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: target.hostname,
        path: target.pathname,
        method: 'POST',
        cert: config.cert,
        key: config.key,
        ca: config.ca,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: SOAP_ACTION,
          'Content-Length': Buffer.byteLength(envelope),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.write(envelope);
    req.end();
  });
}

function parseRiceviFileResponse(body: string): EinvoiceTransportSendResult {
  const faultstring = extractTag(body, 'faultstring');
  if (faultstring) {
    throw new Error(`SDI RiceviFile SOAP fault: ${faultstring}`);
  }
  const identificativoSdI = extractTag(body, 'IdentificativoSdI');
  if (!identificativoSdI) {
    throw new Error(`SDI RiceviFile returned no IdentificativoSdI: ${body}`);
  }
  const errore = extractTag(body, 'Errore');
  if (errore) {
    return {
      providerMessageId: identificativoSdI,
      status: 'rejected',
      errorText: `${errore}: ${SDI_ERROR_DESCRIPTIONS[errore] ?? 'errore non documentato'}`,
      receipt: body,
    };
  }
  return { providerMessageId: identificativoSdI, status: 'sent', receipt: body };
}

@Injectable()
export class SdiTransport implements EinvoiceTransport {
  readonly providerName = 'sdi-sdicoop';
  readonly country = 'IT';

  private readonly config: SdiConfig | null;

  constructor() {
    this.config = readSdiConfig();
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  async send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult> {
    if (!this.config) {
      throw new Error(
        'SdiTransport is not configured: set SDI_ENVIRONMENT, SDI_CLIENT_CERT_PEM, SDI_CLIENT_KEY_PEM, SDI_CA_PEM and SDI_SENDER_VAT.',
      );
    }
    const fileName = buildFileName(this.config.senderVat, params.documentId);
    const xmlBase64 = Buffer.from(params.xml, 'utf8').toString('base64');
    const envelope = buildRiceviFileEnvelope(fileName, xmlBase64);
    let body: string;
    try {
      body = await postRiceviFile(ENDPOINTS[this.config.environment], envelope, this.config);
    } catch (err) {
      throw new Error(`SDI RiceviFile request failed: ${(err as Error).message}`);
    }
    return parseRiceviFileResponse(body);
  }

  // checkStatus is intentionally not implemented: SdIRiceviFile has no query
  // operation. SDI pushes outcomes (RC/NS/MC/NE/DT/AT) to the TrasmissioneFatture
  // callback endpoint declared at accreditation — see SDI.md.
}
