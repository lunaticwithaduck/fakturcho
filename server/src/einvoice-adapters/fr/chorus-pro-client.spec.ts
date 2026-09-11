import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChorusProApiClient } from './chorus-pro-client';

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

describe('ChorusProApiClient.isConfigured', () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it('is false with no env vars set', () => {
    expect(new ChorusProApiClient().isConfigured()).toBe(false);
  });

  it('is true once every credential is set', () => {
    setConfiguredEnv();
    expect(new ChorusProApiClient().isConfigured()).toBe(true);
  });

  it('is false when CHORUSPRO_ENVIRONMENT is not sandbox or prod', () => {
    setConfiguredEnv();
    process.env.CHORUSPRO_ENVIRONMENT = 'staging';
    expect(new ChorusProApiClient().isConfigured()).toBe(false);
  });
});

describe('ChorusProApiClient.post', () => {
  beforeEach(setConfiguredEnv);
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
    vi.unstubAllGlobals();
  });

  it('fetches a token once and reuses it across calls within its lifetime', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ChorusProApiClient();
    await client.post('/deposer/flux', { a: 1 });
    await client.post('/deposer/flux', { a: 2 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://sandbox-oauth.piste.gouv.fr/api/oauth/token',
    );
  });

  it('sends the cpro-account header as base64(login:password)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await new ChorusProApiClient().post('/deposer/flux', {});

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['cpro-account']).toBe(
      Buffer.from('tech-login:tech-password', 'utf8').toString('base64'),
    );
  });

  it('retries once with a fresh token after a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'invalid_token' }))
      .mockResolvedValueOnce(
        jsonResponse(200, { ...TOKEN_RESPONSE_BODY, access_token: 'refreshed' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await new ChorusProApiClient().post('/deposer/flux', {});

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const [, lastInit] = fetchMock.mock.calls[3] as [string, RequestInit];
    expect((lastInit.headers as Record<string, string>).Authorization).toBe('Bearer refreshed');
  });

  it('throws on a 5xx rather than returning a response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, TOKEN_RESPONSE_BODY))
      .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ChorusProApiClient().post('/deposer/flux', {})).rejects.toThrow(/HTTP 503/);
  });

  it('throws when the OAuth token request itself fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(400, { error: 'invalid_client' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ChorusProApiClient().post('/deposer/flux', {})).rejects.toThrow(
      /OAuth token request failed/,
    );
  });
});
