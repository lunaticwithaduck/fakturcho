import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EinvoiceTransportRecipient } from '../../einvoice/transport/einvoice-transport.interface';
import { roDomesticStandardInvoice } from './__fixtures__/ro-domestic-standard';
import { AnafTransport } from './anaf-transport';

const ENV_KEYS = [
  'ANAF_ENVIRONMENT',
  'ANAF_CLIENT_ID',
  'ANAF_CLIENT_SECRET',
  'ANAF_REFRESH_TOKEN',
] as const;

const recipient: EinvoiceTransportRecipient = {
  peppolEndpointId: null,
  peppolScheme: null,
  sdiRecipientCode: null,
  pec: null,
  vatNumber: 'RO14399840',
  countyRegion: null,
};

const sendParams = {
  documentId: roDomesticStandardInvoice.id,
  document: roDomesticStandardInvoice,
  xml: '<Invoice>content</Invoice>',
  recipient,
};

const TOKEN_RESPONSE = {
  access_token: 'access-token-1',
  refresh_token: 'refresh-token',
  expires_in: 7776000,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

function setConfiguredEnv(): void {
  process.env.ANAF_ENVIRONMENT = 'test';
  process.env.ANAF_CLIENT_ID = 'client-id';
  process.env.ANAF_CLIENT_SECRET = 'client-secret';
  process.env.ANAF_REFRESH_TOKEN = 'refresh-token';
}

beforeEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AnafTransport.isConfigured', () => {
  it('is false until all four env vars are set, true once they are', () => {
    expect(new AnafTransport().isConfigured()).toBe(false);
    setConfiguredEnv();
    expect(new AnafTransport().isConfigured()).toBe(true);
  });
});

describe('AnafTransport.send', () => {
  it('throws when not configured, without touching the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(new AnafTransport().send(sendParams)).rejects.toThrow(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns sent with the upload index on ExecutionStatus 0', async () => {
    setConfiguredEnv();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) return jsonResponse(TOKEN_RESPONSE);
        if (href.includes('/upload')) {
          return textResponse(
            '<header xmlns="mfp:anaf:dgti:spv:respUploadFisier:v1" dateResponse="202601010000" ExecutionStatus="0" index_incarcare="5001"/>',
          );
        }
        throw new Error(`unexpected fetch to ${href}`);
      }),
    );

    const result = await new AnafTransport().send(sendParams);
    expect(result).toEqual({ providerMessageId: '5001', status: 'sent' });
  });

  it('returns rejected with the ANAF error text on ExecutionStatus 1', async () => {
    setConfiguredEnv();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) return jsonResponse(TOKEN_RESPONSE);
        if (href.includes('/upload')) {
          return textResponse(
            '<header xmlns="mfp:anaf:dgti:spv:respUploadFisier:v1" dateResponse="202601010000" ExecutionStatus="1"><Errors errorMessage="Cif-ul introdus nu este valid"/></header>',
          );
        }
        throw new Error(`unexpected fetch to ${href}`);
      }),
    );

    const result = await new AnafTransport().send(sendParams);
    expect(result.status).toBe('rejected');
    expect(result.providerMessageId).toBe('');
    expect(result.errorText).toContain('Cif-ul introdus nu este valid');
  });

  it('throws with the real status and body on a 5xx from ANAF', async () => {
    setConfiguredEnv();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) return jsonResponse(TOKEN_RESPONSE);
        return textResponse('Internal Server Error', 500);
      }),
    );

    await expect(new AnafTransport().send(sendParams)).rejects.toThrow(/500/);
  });

  it('refreshes the access token and retries exactly once after a 401', async () => {
    setConfiguredEnv();
    let tokenCalls = 0;
    let uploadCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) {
          tokenCalls += 1;
          return jsonResponse({ ...TOKEN_RESPONSE, access_token: `access-token-${tokenCalls}` });
        }
        if (href.includes('/upload')) {
          uploadCalls += 1;
          if (uploadCalls === 1) return textResponse('token expired', 401);
          return textResponse(
            '<header xmlns="mfp:anaf:dgti:spv:respUploadFisier:v1" ExecutionStatus="0" index_incarcare="5002"/>',
          );
        }
        throw new Error(`unexpected fetch to ${href}`);
      }),
    );

    const result = await new AnafTransport().send(sendParams);
    expect(result).toEqual({ providerMessageId: '5002', status: 'sent' });
    expect(tokenCalls).toBe(2);
    expect(uploadCalls).toBe(2);
  });

  it('reuses the cached access token across calls instead of refreshing every time', async () => {
    setConfiguredEnv();
    let tokenCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) {
          tokenCalls += 1;
          return jsonResponse(TOKEN_RESPONSE);
        }
        return textResponse(
          '<header xmlns="mfp:anaf:dgti:spv:respUploadFisier:v1" ExecutionStatus="0" index_incarcare="5003"/>',
        );
      }),
    );

    const transport = new AnafTransport();
    await transport.send(sendParams);
    await transport.send(sendParams);
    expect(tokenCalls).toBe(1);
  });
});

describe('AnafTransport.checkStatus', () => {
  it('maps "in prelucrare" to pending', async () => {
    setConfiguredEnv();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) return jsonResponse(TOKEN_RESPONSE);
        return textResponse(
          '<header xmlns="mfp:anaf:dgti:efactura:stareMesajFactura:v1" stare="in prelucrare"/>',
        );
      }),
    );

    const result = await new AnafTransport().checkStatus?.('5001');
    expect(result).toEqual({ status: 'pending' });
  });

  it('maps "ok" to accepted and stores the descarcare id as the receipt', async () => {
    setConfiguredEnv();
    let descarcareCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) return jsonResponse(TOKEN_RESPONSE);
        if (href.includes('/stareMesaj')) {
          return textResponse(
            '<header xmlns="mfp:anaf:dgti:efactura:stareMesajFactura:v1" stare="ok" id_descarcare="7042"/>',
          );
        }
        if (href.includes('/descarcare')) {
          descarcareCalls += 1;
          return new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { 'Content-Type': 'application/zip' },
          });
        }
        throw new Error(`unexpected fetch to ${href}`);
      }),
    );

    const result = await new AnafTransport().checkStatus?.('5001');
    expect(result).toEqual({ status: 'accepted', receipt: '7042' });
    expect(descarcareCalls).toBe(1);
  });

  it('maps "nok" to rejected with the ANAF error text', async () => {
    setConfiguredEnv();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) return jsonResponse(TOKEN_RESPONSE);
        return textResponse(
          '<header xmlns="mfp:anaf:dgti:efactura:stareMesajFactura:v1" stare="nok"><Errors errorMessage="Semnatura electronica lipseste"/></header>',
        );
      }),
    );

    const result = await new AnafTransport().checkStatus?.('5001');
    expect(result?.status).toBe('rejected');
    expect(result?.errorText).toContain('Semnatura electronica lipseste');
  });

  it('throws with the real message on a network failure', async () => {
    setConfiguredEnv();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const href = url.toString();
        if (href.includes('anaf-oauth2/v1/token')) return jsonResponse(TOKEN_RESPONSE);
        throw new TypeError('fetch failed');
      }),
    );

    await expect(new AnafTransport().checkStatus?.('5001')).rejects.toThrow(/fetch failed/);
  });
});
