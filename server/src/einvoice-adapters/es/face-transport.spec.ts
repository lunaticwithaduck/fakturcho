import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { EinvoiceTransportSendParams } from '../../einvoice/transport/einvoice-transport.interface';
import { esDomesticStandardInvoice } from './__fixtures__/es-domestic-standard';
import { FaceTransport } from './face-transport';
import type { SoapHttpResponse, SoapPost } from './soap-http';

let certPem: string;
let keyPem: string;
let workdir: string;

const CONFIGURED_ENV: NodeJS.ProcessEnv = {
  FACE_ENVIRONMENT: 'test',
  get FACE_SIGNING_CERT_PEM() {
    return certPem;
  },
  get FACE_SIGNING_KEY_PEM() {
    return keyPem;
  },
} as unknown as NodeJS.ProcessEnv;

beforeAll(() => {
  workdir = mkdtempSync(join(tmpdir(), 'face-transport-test-'));
  const keyPath = join(workdir, 'key.pem');
  const certPath = join(workdir, 'cert.pem');
  execFileSync('openssl', [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-keyout',
    keyPath,
    '-out',
    certPath,
    '-days',
    '1',
    '-nodes',
    '-subj',
    '/CN=fakturcho-test',
  ]);
  keyPem = readFileSync(keyPath, 'utf8');
  certPem = readFileSync(certPath, 'utf8');
});

afterAll(() => {
  rmSync(workdir, { recursive: true, force: true });
});

function sendParams(): EinvoiceTransportSendParams {
  return {
    documentId: esDomesticStandardInvoice.id,
    document: esDomesticStandardInvoice,
    xml: '<Facturae/>',
    recipient: {
      peppolEndpointId: null,
      peppolScheme: null,
      sdiRecipientCode: null,
      pec: null,
      vatNumber: esDomesticStandardInvoice.recipient.vatNumber,
      countyRegion: null,
    },
  };
}

function envelopeWith(inner: string): SoapHttpResponse {
  return {
    statusCode: 200,
    body:
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>' +
      inner +
      '</soapenv:Body></soapenv:Envelope>',
  };
}

const ENVIAR_OK = envelopeWith(
  '<ns1:enviarFacturaResponse xmlns:ns1="https://webservice.face.gob.es"><return>' +
    '<resultado><codigo>0</codigo><descripcion>OK</descripcion></resultado>' +
    '<factura><numeroRegistro>202400001234</numeroRegistro></factura>' +
    '</return></ns1:enviarFacturaResponse>',
);

const ENVIAR_REJECTED = envelopeWith(
  '<ns1:enviarFacturaResponse xmlns:ns1="https://webservice.face.gob.es"><return>' +
    '<resultado><codigo>2</codigo><descripcion>DIR3 code not found</descripcion></resultado>' +
    '</return></ns1:enviarFacturaResponse>',
);

function consultarResponse(tramitacionCodigo: string, anulacionCodigo = '4100'): SoapHttpResponse {
  return envelopeWith(
    '<ns1:consultarFacturaResponse xmlns:ns1="https://webservice.face.gob.es"><return>' +
      '<resultado><codigo>0</codigo><descripcion>OK</descripcion></resultado>' +
      '<factura><numeroRegistro>202400001234</numeroRegistro>' +
      `<tramitacion><codigo>${tramitacionCodigo}</codigo><descripcion>estado</descripcion></tramitacion>` +
      `<anulacion><codigo>${anulacionCodigo}</codigo><descripcion>estado</descripcion></anulacion>` +
      '</factura></return></ns1:consultarFacturaResponse>',
  );
}

describe('FaceTransport.isConfigured', () => {
  it('is false without both signing cert and key', () => {
    expect(new FaceTransport(vi.fn(), {}).isConfigured()).toBe(false);
  });

  it('is true once FACE_ENVIRONMENT, cert and key are set', () => {
    expect(new FaceTransport(vi.fn(), CONFIGURED_ENV).isConfigured()).toBe(true);
  });
});

describe('FaceTransport.send', () => {
  it('rejects without calling the network when not configured', async () => {
    const post = vi.fn();
    const result = await new FaceTransport(post, {}).send(sendParams());
    expect(result.status).toBe('rejected');
    expect(result.errorText).toMatch(/not configured/i);
    expect(post).not.toHaveBeenCalled();
  });

  it('signs the request with WS-Security and returns numeroRegistro on success', async () => {
    let sentSignedXml = '';
    const post: SoapPost = vi.fn(async (url, body, soapAction) => {
      sentSignedXml = body;
      expect(url).toBe('https://se-face-webservice.redsara.es/facturasspp2');
      expect(soapAction).toBe('https://webservice.face.gob.es#enviarFactura');
      return ENVIAR_OK;
    });
    const transport = new FaceTransport(post, CONFIGURED_ENV);

    const result = await transport.send(sendParams());

    expect(result.status).toBe('sent');
    expect(result.providerMessageId).toBe('202400001234');
    expect(sentSignedXml).toContain('<wsse:BinarySecurityToken');
    expect(sentSignedXml).toContain('<ds:Signature');
    expect(sentSignedXml).toContain(Buffer.from('<Facturae/>', 'utf8').toString('base64'));
  });

  it('rejects when resultado.codigo is not 0', async () => {
    const post: SoapPost = vi.fn(async () => ENVIAR_REJECTED);
    const result = await new FaceTransport(post, CONFIGURED_ENV).send(sendParams());
    expect(result.status).toBe('rejected');
    expect(result.errorText).toBe('DIR3 code not found');
  });

  it('rejects on a SOAP fault', async () => {
    const post: SoapPost = vi.fn(async () => ({
      statusCode: 500,
      body:
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>' +
        '<soapenv:Fault><faultstring>invalid signature</faultstring></soapenv:Fault>' +
        '</soapenv:Body></soapenv:Envelope>',
    }));
    const result = await new FaceTransport(post, CONFIGURED_ENV).send(sendParams());
    expect(result.status).toBe('rejected');
    expect(result.errorText).toBe('invalid signature');
  });

  it('rejects when the network request throws', async () => {
    const post: SoapPost = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    const result = await new FaceTransport(post, CONFIGURED_ENV).send(sendParams());
    expect(result.status).toBe('rejected');
    expect(result.errorText).toContain('ECONNREFUSED');
  });
});

describe('FaceTransport.checkStatus', () => {
  it('reports accepted for a Registrada (1200) invoice with no cancellation', async () => {
    const post: SoapPost = vi.fn(async () => consultarResponse('1200'));
    const result = await new FaceTransport(post, CONFIGURED_ENV).checkStatus('202400001234');
    expect(result.status).toBe('accepted');
  });

  it('reports accepted for a Pagada (2500) invoice', async () => {
    const post: SoapPost = vi.fn(async () => consultarResponse('2500'));
    const result = await new FaceTransport(post, CONFIGURED_ENV).checkStatus('202400001234');
    expect(result.status).toBe('accepted');
  });

  it('reports rejected for a Rechazada (2600) invoice', async () => {
    const post: SoapPost = vi.fn(async () => consultarResponse('2600'));
    const result = await new FaceTransport(post, CONFIGURED_ENV).checkStatus('202400001234');
    expect(result.status).toBe('rejected');
  });

  it('reports rejected once a cancellation has been accepted (anulacion 4300)', async () => {
    const post: SoapPost = vi.fn(async () => consultarResponse('1200', '4300'));
    const result = await new FaceTransport(post, CONFIGURED_ENV).checkStatus('202400001234');
    expect(result.status).toBe('rejected');
  });

  it('reports pending when resultado.codigo is not 0', async () => {
    const post: SoapPost = vi.fn(async () =>
      envelopeWith(
        '<ns1:consultarFacturaResponse xmlns:ns1="https://webservice.face.gob.es"><return>' +
          '<resultado><codigo>3</codigo><descripcion>unknown numeroRegistro</descripcion></resultado>' +
          '</return></ns1:consultarFacturaResponse>',
      ),
    );
    const result = await new FaceTransport(post, CONFIGURED_ENV).checkStatus('does-not-exist');
    expect(result.status).toBe('pending');
    expect(result.errorText).toBe('unknown numeroRegistro');
  });
});
