import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EinvoiceTransportSendParams } from '../../einvoice/transport/einvoice-transport.interface';
import { itDomesticStandardInvoice } from './__fixtures__/it-domestic-standard';
import { toFatturaPaXml } from './fatturapa-mapper';
import { SdiTransport } from './sdi-transport';

const httpsRequestMock = vi.fn();
vi.mock('node:https', () => ({
  request: (...args: unknown[]) => httpsRequestMock(...args),
}));

interface FakeRequest extends EventEmitter {
  write: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}

function respondWith(body: string, requests: FakeRequest[] = []) {
  return (_options: unknown, callback: (res: EventEmitter) => void) => {
    const req = new EventEmitter() as FakeRequest;
    req.write = vi.fn();
    req.end = vi.fn(() => {
      const res = new EventEmitter();
      callback(res);
      queueMicrotask(() => {
        res.emit('data', Buffer.from(body, 'utf8'));
        res.emit('end');
      });
    });
    requests.push(req);
    return req;
  };
}

function failWith(error: Error) {
  return () => {
    const req = new EventEmitter() as FakeRequest;
    req.write = vi.fn();
    req.end = vi.fn(() => {
      queueMicrotask(() => req.emit('error', error));
    });
    return req;
  };
}

const SUCCESS_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:rispostaSdIRiceviFile xmlns:ns2="http://www.fatturapa.gov.it/sdi/ws/trasmissione/v1.0/types">
      <IdentificativoSdI>123456789012</IdentificativoSdI>
      <DataOraRicezione>2026-09-11T10:15:30.000+02:00</DataOraRicezione>
    </ns2:rispostaSdIRiceviFile>
  </soap:Body>
</soap:Envelope>`;

function errorResponse(identificativoSdI: string, code: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns2:rispostaSdIRiceviFile xmlns:ns2="http://www.fatturapa.gov.it/sdi/ws/trasmissione/v1.0/types">
      <IdentificativoSdI>${identificativoSdI}</IdentificativoSdI>
      <DataOraRicezione>2026-09-11T10:16:00.000+02:00</DataOraRicezione>
      <Errore>${code}</Errore>
    </ns2:rispostaSdIRiceviFile>
  </soap:Body>
</soap:Envelope>`;
}

const SOAP_FAULT = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Server</faultcode>
      <faultstring>internal server error</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;

const ENV_VARS = [
  'SDI_ENVIRONMENT',
  'SDI_CLIENT_CERT_PEM',
  'SDI_CLIENT_KEY_PEM',
  'SDI_CA_PEM',
  'SDI_SENDER_VAT',
] as const;

function setConfigured(environment: 'test' | 'prod' = 'test'): void {
  process.env.SDI_ENVIRONMENT = environment;
  process.env.SDI_CLIENT_CERT_PEM =
    '-----BEGIN CERTIFICATE-----\\nZmFrZQ==\\n-----END CERTIFICATE-----';
  process.env.SDI_CLIENT_KEY_PEM =
    '-----BEGIN PRIVATE KEY-----\\nZmFrZQ==\\n-----END PRIVATE KEY-----';
  process.env.SDI_CA_PEM = '-----BEGIN CERTIFICATE-----\\nZmFrZQ==\\n-----END CERTIFICATE-----';
  process.env.SDI_SENDER_VAT = 'IT01234567897';
}

function sendParams(): EinvoiceTransportSendParams {
  return {
    documentId: 'doc-it-domestic-1',
    document: itDomesticStandardInvoice,
    xml: toFatturaPaXml(itDomesticStandardInvoice),
    recipient: {
      peppolEndpointId: null,
      peppolScheme: null,
      sdiRecipientCode: null,
      pec: 'ufficio@bianchi.it',
      vatNumber: 'IT98765432103',
      countyRegion: null,
    },
  };
}

describe('SdiTransport', () => {
  beforeEach(() => {
    httpsRequestMock.mockReset();
  });

  afterEach(() => {
    for (const key of ENV_VARS) delete process.env[key];
  });

  describe('isConfigured', () => {
    it('is false when no SDI env vars are set', () => {
      expect(new SdiTransport().isConfigured()).toBe(false);
    });

    it('is false when one required var is missing', () => {
      setConfigured();
      delete process.env.SDI_CA_PEM;
      expect(new SdiTransport().isConfigured()).toBe(false);
    });

    it('is true when environment and all PEM material are set', () => {
      setConfigured();
      expect(new SdiTransport().isConfigured()).toBe(true);
    });
  });

  describe('send', () => {
    it('throws instead of calling SDI when not configured', async () => {
      const transport = new SdiTransport();
      await expect(transport.send(sendParams())).rejects.toThrow(/not configured/);
      expect(httpsRequestMock).not.toHaveBeenCalled();
    });

    it('posts a RiceviFile SOAP envelope over mutual TLS to the test endpoint', async () => {
      setConfigured('test');
      const requests: FakeRequest[] = [];
      httpsRequestMock.mockImplementation(respondWith(SUCCESS_RESPONSE, requests));

      const transport = new SdiTransport();
      const result = await transport.send(sendParams());

      expect(result).toEqual({
        providerMessageId: '123456789012',
        status: 'sent',
        receipt: SUCCESS_RESPONSE,
      });

      const options = httpsRequestMock.mock.calls[0]?.[0];
      expect(options?.hostname).toBe('testservizi.fatturapa.it');
      expect(options?.path).toBe('/ricevi_file');
      expect(options?.method).toBe('POST');
      expect(options?.cert).toContain('BEGIN CERTIFICATE');
      expect(options?.key).toContain('BEGIN PRIVATE KEY');
      expect(options?.ca).toContain('BEGIN CERTIFICATE');
      expect(options?.headers.SOAPAction).toBe('http://www.fatturapa.it/SdIRiceviFile/RiceviFile');

      const body = requests[0]?.write.mock.calls[0]?.[0] as string;
      expect(body).toContain('<tns:fileSdIAccoglienza');
      expect(body).toMatch(/<tns:NomeFile>IT01234567897_[A-Z0-9]{5}\.xml<\/tns:NomeFile>/);
      expect(body).toContain(
        `<tns:File>${Buffer.from(sendParams().xml, 'utf8').toString('base64')}</tns:File>`,
      );
    });

    it('posts to the production endpoint when SDI_ENVIRONMENT=prod', async () => {
      setConfigured('prod');
      httpsRequestMock.mockImplementation(respondWith(SUCCESS_RESPONSE));

      await new SdiTransport().send(sendParams());

      const options = httpsRequestMock.mock.calls[0]?.[0];
      expect(options?.hostname).toBe('servizi.fatturapa.it');
    });

    it('reports EI01 (empty file) as a rejection carrying the real SDI identifier', async () => {
      setConfigured();
      httpsRequestMock.mockImplementation(respondWith(errorResponse('123456789013', 'EI01')));

      const result = await new SdiTransport().send(sendParams());

      expect(result.status).toBe('rejected');
      expect(result.providerMessageId).toBe('123456789013');
      expect(result.errorText).toContain('EI01');
    });

    it('reports EI02 (service unavailable) as a rejection', async () => {
      setConfigured();
      httpsRequestMock.mockImplementation(respondWith(errorResponse('123456789014', 'EI02')));

      const result = await new SdiTransport().send(sendParams());

      expect(result.status).toBe('rejected');
      expect(result.errorText).toContain('EI02');
    });

    it('reports EI03 (utente non abilitato) as a rejection', async () => {
      setConfigured();
      httpsRequestMock.mockImplementation(respondWith(errorResponse('123456789015', 'EI03')));

      const result = await new SdiTransport().send(sendParams());

      expect(result.status).toBe('rejected');
      expect(result.errorText).toContain('EI03');
      expect(result.errorText).toContain('utente non abilitato');
    });

    it('propagates the real error on a TLS/network failure instead of fabricating a result', async () => {
      setConfigured();
      const networkError = new Error('unable to verify the first certificate');
      httpsRequestMock.mockImplementation(failWith(networkError));

      await expect(new SdiTransport().send(sendParams())).rejects.toThrow(
        /unable to verify the first certificate/,
      );
    });

    it('throws on a SOAP fault instead of returning a fabricated result', async () => {
      setConfigured();
      httpsRequestMock.mockImplementation(respondWith(SOAP_FAULT));

      await expect(new SdiTransport().send(sendParams())).rejects.toThrow(/internal server error/);
    });
  });
});
