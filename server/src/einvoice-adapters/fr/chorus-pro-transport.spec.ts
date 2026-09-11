import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EinvoiceTransportRecipient } from '../../einvoice/transport/einvoice-transport.interface';
import { frDomesticStandardInvoice } from './__fixtures__/fr-domestic-standard';
import { ChorusProTransport } from './chorus-pro-transport';

const ENV_KEYS = [
  'CHORUSPRO_ENVIRONMENT',
  'CHORUSPRO_CLIENT_ID',
  'CHORUSPRO_CLIENT_SECRET',
  'CHORUSPRO_TECH_LOGIN',
  'CHORUSPRO_TECH_PASSWORD',
] as const;

function setConfiguredEnv(): void {
  process.env.CHORUSPRO_ENVIRONMENT = 'sandbox';
  process.env.CHORUSPRO_CLIENT_ID = 'client-id';
  process.env.CHORUSPRO_CLIENT_SECRET = 'client-secret';
  process.env.CHORUSPRO_TECH_LOGIN = 'tech-login';
  process.env.CHORUSPRO_TECH_PASSWORD = 'tech-password';
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const TOKEN_RESPONSE_BODY = {
  access_token: 'sandbox-access-token',
  token_type: 'Bearer',
  expires_in: 1200,
  scope: 'openid',
};

const emptyRecipient: EinvoiceTransportRecipient = {
  peppolEndpointId: null,
  peppolScheme: null,
  sdiRecipientCode: null,
  pec: null,
  vatNumber: null,
  countyRegion: null,
};

const publicSectorInvoice = {
  ...frDomesticStandardInvoice,
  id: 'doc-fr-public-1',
  recipient: {
    ...frDomesticStandardInvoice.recipient,
    companyName: 'Commune de Testville',
    eik: '20000000800009',
    vatNumber: null,
  },
};

describe('ChorusProTransport.isConfigured', () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it('is false with no env vars set', () => {
    expect(new ChorusProTransport().isConfigured()).toBe(false);
  });

  it('is true once every credential is set', () => {
    setConfiguredEnv();
    expect(new ChorusProTransport().isConfigured()).toBe(true);
  });
});

describe('ChorusProTransport.send', () => {
  beforeEach(setConfiguredEnv);
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
    vi.unstubAllGlobals();
  });

  it('throws EINVOICE_TRANSPORT_NOT_CONFIGURED for a private-sector recipient', async () => {
    await expect(
      new ChorusProTransport().send({
        documentId: frDomesticStandardInvoice.id,
        document: frDomesticStandardInvoice,
        xml: '<Invoice/>',
        recipient: emptyRecipient,
      }),
    ).rejects.toMatchObject({ code: 'EINVOICE_TRANSPORT_NOT_CONFIGURED' });
  });

  it('deposits the UBL flow and returns the flow number on success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(jsonResponse(200, { numeroFluxDepot: 'CPP0021100000000000000023' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await new ChorusProTransport().send({
      documentId: publicSectorInvoice.id,
      document: publicSectorInvoice,
      xml: '<Invoice>content</Invoice>',
      recipient: emptyRecipient,
    });

    expect(result).toEqual({ providerMessageId: 'CPP0021100000000000000023', status: 'sent' });
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://sandbox-api.piste.gouv.fr/cpro/factures/v1/deposer/flux',
    );
  });

  it('returns rejected with the documented error body on a deposit error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(
        jsonResponse(400, {
          codeRetour: 2001,
          libelle: 'Fichier flux invalide : SIRET destinataire inconnu',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await new ChorusProTransport().send({
      documentId: publicSectorInvoice.id,
      document: publicSectorInvoice,
      xml: '<Invoice>content</Invoice>',
      recipient: emptyRecipient,
    });

    expect(result).toEqual({
      providerMessageId: '',
      status: 'rejected',
      errorText: 'Fichier flux invalide : SIRET destinataire inconnu',
    });
  });

  it('retries once after a 401 and succeeds with the refreshed token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'invalid_token' }))
      .mockResolvedValueOnce(
        jsonResponse(200, { ...TOKEN_RESPONSE_BODY, access_token: 'refreshed-token' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { numeroFluxDepot: 'CPP0021100000000000000099' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await new ChorusProTransport().send({
      documentId: publicSectorInvoice.id,
      document: publicSectorInvoice,
      xml: '<Invoice>content</Invoice>',
      recipient: emptyRecipient,
    });

    expect(result.status).toBe('sent');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('throws on a 5xx instead of reporting a fabricated rejection', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new ChorusProTransport().send({
        documentId: publicSectorInvoice.id,
        document: publicSectorInvoice,
        xml: '<Invoice>content</Invoice>',
        recipient: emptyRecipient,
      }),
    ).rejects.toThrow(/HTTP 503/);
  });
});

describe('ChorusProTransport.checkStatus', () => {
  beforeEach(setConfiguredEnv);
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
    vi.unstubAllGlobals();
  });

  it('maps an accepted lifecycle status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(jsonResponse(200, { statutCourant: 'MISE_A_DISPOSITION' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new ChorusProTransport().checkStatus('CPP0021100000000000000023'),
    ).resolves.toEqual({ status: 'accepted' });
  });

  it('maps a rejected lifecycle status with its error text', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          statutCourant: 'REJETEE',
          libelle: 'Facture rejetée par le destinataire',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new ChorusProTransport().checkStatus('CPP0021100000000000000023'),
    ).resolves.toEqual({ status: 'rejected', errorText: 'Facture rejetée par le destinataire' });
  });

  it('maps an in-flight lifecycle status to pending', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(jsonResponse(200, { statutCourant: 'DEPOSEE' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new ChorusProTransport().checkStatus('CPP0021100000000000000023'),
    ).resolves.toEqual({ status: 'pending' });
  });
});
