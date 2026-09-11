import { describe, expect, it, vi } from 'vitest';
import type { EinvoiceTransportSendParams } from '../../einvoice/transport/einvoice-transport.interface';
import { esDomesticStandardInvoice } from './__fixtures__/es-domestic-standard';
import type { SoapHttpResponse, SoapPost } from './soap-http';
import type { VerifactuChainStore } from './verifactu-chain-store';
import type { VerifactuChainLink } from './verifactu-mapper';
import { VerifactuTransport } from './verifactu-transport';

const CONFIGURED_ENV: NodeJS.ProcessEnv = {
  AEAT_ENVIRONMENT: 'test',
  AEAT_CLIENT_CERT_PEM: '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----',
  AEAT_CLIENT_KEY_PEM: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
  AEAT_ISSUER_NIF: 'B12345674',
  AEAT_SOFTWARE_NIF: 'B00000001',
};

function fakeChainStore(initial: VerifactuChainLink | null = null): VerifactuChainStore {
  let stored = initial;
  return {
    getLast: vi.fn(async () => stored),
    save: vi.fn(async (_issuerNif: string, link: VerifactuChainLink) => {
      stored = link;
    }),
  };
}

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

function respuesta(
  estadoEnvio: string,
  estadoRegistro: string | null,
  extra = '',
): SoapHttpResponse {
  const linea = estadoRegistro
    ? `<tik:RespuestaLinea><tik:EstadoRegistro>${estadoRegistro}</tik:EstadoRegistro>${extra}</tik:RespuestaLinea>`
    : '';
  return {
    statusCode: 200,
    body:
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>' +
      '<tik:RespuestaRegFactuSistemaFacturacion xmlns:tik="urn:RespuestaSuministro">' +
      '<tik:CSV>ABCDEFGH12345678</tik:CSV>' +
      `<tik:EstadoEnvio>${estadoEnvio}</tik:EstadoEnvio>` +
      linea +
      '</tik:RespuestaRegFactuSistemaFacturacion></soapenv:Body></soapenv:Envelope>',
  };
}

describe('VerifactuTransport.isConfigured', () => {
  it('is false when required env vars are missing', () => {
    const transport = new VerifactuTransport(fakeChainStore(), vi.fn(), {});
    expect(transport.isConfigured()).toBe(false);
  });

  it('is true once cert, key, issuer NIF and software NIF are all set', () => {
    const transport = new VerifactuTransport(fakeChainStore(), vi.fn(), CONFIGURED_ENV);
    expect(transport.isConfigured()).toBe(true);
  });
});

describe('VerifactuTransport.send', () => {
  it('rejects without calling the network when not configured', async () => {
    const post = vi.fn();
    const transport = new VerifactuTransport(fakeChainStore(), post, {});
    const result = await transport.send(sendParams());
    expect(result.status).toBe('rejected');
    expect(result.errorText).toMatch(/not configured/i);
    expect(post).not.toHaveBeenCalled();
  });

  it('sends the mutual-TLS request to the test endpoint and returns the CSV on Correcto', async () => {
    const post: SoapPost = vi.fn(async () => respuesta('Correcto', 'Correcto'));
    const chainStore = fakeChainStore();
    const transport = new VerifactuTransport(
      chainStore,
      post,
      CONFIGURED_ENV,
      () => new Date('2026-09-04T09:00:00Z'),
    );

    const result = await transport.send(sendParams());

    expect(result.status).toBe('sent');
    expect(result.providerMessageId).toContain('ABCDEFGH12345678');
    expect(post).toHaveBeenCalledWith(
      'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
      expect.any(String),
      'RegFactuSistemaFacturacion',
      expect.objectContaining({ cert: CONFIGURED_ENV.AEAT_CLIENT_CERT_PEM }),
    );
    expect(chainStore.save).toHaveBeenCalledTimes(1);
  });

  it('returns sent with the admissible-error text on AceptadoConErrores, and still advances the chain', async () => {
    const post = vi.fn(async () =>
      respuesta(
        'ParcialmenteCorrecto',
        'AceptadoConErrores',
        '<tik:DescripcionErrorRegistro>minor issue</tik:DescripcionErrorRegistro>',
      ),
    );
    const chainStore = fakeChainStore();
    const transport = new VerifactuTransport(chainStore, post, CONFIGURED_ENV);

    const result = await transport.send(sendParams());

    expect(result.status).toBe('sent');
    expect(result.errorText).toBe('minor issue');
    expect(chainStore.save).toHaveBeenCalledTimes(1);
  });

  it('rejects on Incorrecto and never advances the chain', async () => {
    const post = vi.fn(async () =>
      respuesta(
        'Incorrecto',
        'Incorrecto',
        '<tik:CodigoErrorRegistro>1234</tik:CodigoErrorRegistro><tik:DescripcionErrorRegistro>bad NIF</tik:DescripcionErrorRegistro>',
      ),
    );
    const chainStore = fakeChainStore();
    const transport = new VerifactuTransport(chainStore, post, CONFIGURED_ENV);

    const result = await transport.send(sendParams());

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBe('[1234] bad NIF');
    expect(chainStore.save).not.toHaveBeenCalled();
  });

  it('rejects on a SOAP fault without touching the chain', async () => {
    const post = vi.fn(
      async (): Promise<SoapHttpResponse> => ({
        statusCode: 500,
        body:
          '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>' +
          '<soapenv:Fault><faultstring>schema validation failed</faultstring></soapenv:Fault>' +
          '</soapenv:Body></soapenv:Envelope>',
      }),
    );
    const chainStore = fakeChainStore();
    const transport = new VerifactuTransport(chainStore, post, CONFIGURED_ENV);

    const result = await transport.send(sendParams());

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBe('schema validation failed');
    expect(chainStore.save).not.toHaveBeenCalled();
  });

  it('rejects when the TLS/network request itself throws', async () => {
    const post = vi.fn(async () => {
      throw new Error('certificate expired');
    });
    const transport = new VerifactuTransport(fakeChainStore(), post, CONFIGURED_ENV);

    const result = await transport.send(sendParams());

    expect(result.status).toBe('rejected');
    expect(result.errorText).toContain('certificate expired');
  });

  it('chains off the previously stored Huella for the same issuer', async () => {
    const previous: VerifactuChainLink = {
      idEmisorFactura: 'B12345674',
      numSerieFactura: '0000000014',
      fechaExpedicionFactura: '03-09-2026',
      huella: 'PREVIOUSHASH',
    };
    const chainStore = fakeChainStore(previous);
    let sentEnvelope = '';
    const post = vi.fn(async (_url: string, body: string) => {
      sentEnvelope = body;
      return respuesta('Correcto', 'Correcto');
    });
    const transport = new VerifactuTransport(chainStore, post, CONFIGURED_ENV);

    await transport.send(sendParams());

    expect(sentEnvelope).toContain('<sf:RegistroAnterior>');
    expect(sentEnvelope).toContain('<sf:Huella>PREVIOUSHASH</sf:Huella>');
  });
});

describe('VerifactuTransport.checkStatus', () => {
  it('reports accepted for a Correcta record', async () => {
    const post = vi.fn(
      async (): Promise<SoapHttpResponse> => ({
        statusCode: 200,
        body:
          '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>' +
          '<tik:RespuestaConsultaFactuSistemaFacturacion xmlns:tik="urn:RespuestaConsultaLR">' +
          '<tik:ResultadoConsulta>ConDatos</tik:ResultadoConsulta>' +
          '<tik:RegistroFactura><tik:EstadoRegistro><tik:EstadoRegistro>Correcta</tik:EstadoRegistro></tik:EstadoRegistro></tik:RegistroFactura>' +
          '</tik:RespuestaConsultaFactuSistemaFacturacion></soapenv:Body></soapenv:Envelope>',
      }),
    );
    const transport = new VerifactuTransport(fakeChainStore(), post, CONFIGURED_ENV);

    const result = await transport.checkStatus('CSV123|B12345674|0000000015|04-09-2026');

    expect(result.status).toBe('accepted');
  });

  it('reports rejected when AEAT has no record', async () => {
    const post = vi.fn(
      async (): Promise<SoapHttpResponse> => ({
        statusCode: 200,
        body:
          '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body>' +
          '<tik:RespuestaConsultaFactuSistemaFacturacion xmlns:tik="urn:RespuestaConsultaLR">' +
          '<tik:ResultadoConsulta>SinDatos</tik:ResultadoConsulta>' +
          '</tik:RespuestaConsultaFactuSistemaFacturacion></soapenv:Body></soapenv:Envelope>',
      }),
    );
    const transport = new VerifactuTransport(fakeChainStore(), post, CONFIGURED_ENV);

    const result = await transport.checkStatus('CSV123|B12345674|0000000015|04-09-2026');

    expect(result.status).toBe('rejected');
  });

  it('reports pending when the providerMessageId cannot be decoded', async () => {
    const transport = new VerifactuTransport(fakeChainStore(), vi.fn(), CONFIGURED_ENV);
    const result = await transport.checkStatus('not-a-verifactu-id');
    expect(result.status).toBe('pending');
  });
});
