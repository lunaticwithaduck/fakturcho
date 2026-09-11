import { execFileSync } from 'node:child_process';
import {
  constants,
  createDecipheriv,
  createPrivateKey,
  privateDecrypt,
  X509Certificate,
} from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { KsefTransport } from './ksef-transport';

let certificateBase64: string;
let privateKeyPem: string;

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), 'ksef-test-key-'));
  const keyPath = join(dir, 'key.pem');
  const certPath = join(dir, 'cert.pem');
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
    '/CN=ksef-test',
  ]);
  privateKeyPem = readFileSync(keyPath, 'utf8');
  certificateBase64 = new X509Certificate(readFileSync(certPath)).raw.toString('base64');
});

function rsaOaepDecrypt(base64Ciphertext: string): Buffer {
  return privateDecrypt(
    {
      key: createPrivateKey(privateKeyPem),
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(base64Ciphertext, 'base64'),
  );
}

const FUTURE = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 60 * 60 * 1000).toISOString();

function certificatesResponse() {
  return [
    {
      certificate: certificateBase64,
      certificateId: 'cert-1',
      publicKeyId: 'A'.repeat(44),
      usage: ['KsefTokenEncryption', 'SymmetricKeyEncryption'],
      validFrom: PAST,
      validTo: FUTURE,
    },
  ];
}

interface Call {
  method: string;
  path: string;
  body: unknown;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
  });
}

function installFetch(handler: (call: Call) => Response): { calls: Call[] } {
  const calls: Call[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = init?.method ?? 'GET';
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      const call = { method, path: url.pathname.replace(/^\/v2/, ''), body };
      calls.push(call);
      return handler(call);
    }),
  );
  return { calls };
}

function happyPathHandler(overrides: Partial<Record<string, () => Response>> = {}) {
  return (call: Call): Response => {
    const override = overrides[`${call.method} ${call.path}`];
    if (override) return override();

    if (call.method === 'POST' && call.path === '/auth/challenge') {
      return jsonResponse(200, {
        challenge: 'challenge-abc',
        timestamp: new Date().toISOString(),
        timestampMs: 1_700_000_000_000,
        clientIp: '127.0.0.1',
      });
    }
    if (call.method === 'GET' && call.path === '/security/public-key-certificates') {
      return jsonResponse(200, certificatesResponse());
    }
    if (call.method === 'POST' && call.path === '/auth/ksef-token') {
      return jsonResponse(202, {
        referenceNumber: 'auth-ref-1',
        authenticationToken: { token: 'authentication-token-1', validUntil: FUTURE },
      });
    }
    if (call.method === 'GET' && call.path === '/auth/auth-ref-1') {
      return jsonResponse(200, {
        status: { code: 200, description: 'Uwierzytelnianie zakończone sukcesem' },
      });
    }
    if (call.method === 'POST' && call.path === '/auth/token/redeem') {
      return jsonResponse(200, {
        accessToken: { token: 'access-token-1', validUntil: FUTURE },
        refreshToken: { token: 'refresh-token-1', validUntil: FUTURE },
      });
    }
    if (call.method === 'POST' && call.path === '/sessions/online') {
      return jsonResponse(201, { referenceNumber: 'session-ref-1', validUntil: FUTURE });
    }
    if (call.method === 'POST' && call.path === '/sessions/online/session-ref-1/invoices') {
      return jsonResponse(202, { referenceNumber: 'invoice-ref-1' });
    }
    if (call.method === 'POST' && call.path === '/sessions/online/session-ref-1/close') {
      return jsonResponse(204, undefined);
    }
    throw new Error(`unstubbed call: ${call.method} ${call.path}`);
  };
}

describe('KsefTransport', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.KSEF_ENVIRONMENT = 'test';
    process.env.KSEF_NIP = '1234563218';
    process.env.KSEF_TOKEN = 'test-ksef-token';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  describe('isConfigured', () => {
    it('is true when environment, NIP and token are all set', () => {
      expect(new KsefTransport().isConfigured()).toBe(true);
    });

    it('is false when KSEF_ENVIRONMENT is missing or invalid', () => {
      delete process.env.KSEF_ENVIRONMENT;
      expect(new KsefTransport().isConfigured()).toBe(false);
      process.env.KSEF_ENVIRONMENT = 'sandbox';
      expect(new KsefTransport().isConfigured()).toBe(false);
    });

    it('is false when KSEF_NIP or KSEF_TOKEN is missing', () => {
      delete process.env.KSEF_NIP;
      expect(new KsefTransport().isConfigured()).toBe(false);
      process.env.KSEF_NIP = '1234563218';
      delete process.env.KSEF_TOKEN;
      expect(new KsefTransport().isConfigured()).toBe(false);
    });
  });

  it('throws without calling the network when not configured', async () => {
    delete process.env.KSEF_TOKEN;
    const { calls } = installFetch(happyPathHandler());
    const transport = new KsefTransport();

    await expect(
      transport.send({
        documentId: 'doc-1',
        document: {} as never,
        xml: '<Faktura/>',
        recipient: {
          peppolEndpointId: null,
          peppolScheme: null,
          sdiRecipientCode: null,
          pec: null,
          vatNumber: null,
          countyRegion: null,
        },
      }),
    ).rejects.toThrow('not configured');
    expect(calls).toHaveLength(0);
  });

  describe('send', () => {
    const params = {
      documentId: 'doc-1',
      document: {} as never,
      xml: '<Faktura>tresc faktury FA(3)</Faktura>',
      recipient: {
        peppolEndpointId: null,
        peppolScheme: null,
        sdiRecipientCode: null,
        pec: null,
        vatNumber: null,
        countyRegion: null,
      },
    };

    it('runs the full documented flow and returns a composite providerMessageId', async () => {
      installFetch(happyPathHandler());
      const transport = new KsefTransport();

      const result = await transport.send(params);

      expect(result).toEqual({ providerMessageId: 'session-ref-1:invoice-ref-1', status: 'sent' });
    });

    it('encrypts the KSeF token and the session key so they decrypt correctly with the real private key', async () => {
      const { calls } = installFetch(happyPathHandler());
      const transport = new KsefTransport();

      await transport.send(params);

      const authCall = calls.find((c) => c.path === '/auth/ksef-token');
      if (!authCall) throw new Error('expected a /auth/ksef-token call');
      const decryptedToken = rsaOaepDecrypt(
        (authCall.body as { encryptedToken: string }).encryptedToken,
      ).toString('utf8');
      expect(decryptedToken).toBe('test-ksef-token|1700000000000');

      const openSessionCall = calls.find((c) => c.path === '/sessions/online');
      if (!openSessionCall) throw new Error('expected a /sessions/online call');
      const encryption = (
        openSessionCall.body as {
          encryption: { encryptedSymmetricKey: string; initializationVector: string };
        }
      ).encryption;
      const aesKey = rsaOaepDecrypt(encryption.encryptedSymmetricKey);
      expect(aesKey).toHaveLength(32);
      const iv = Buffer.from(encryption.initializationVector, 'base64');
      expect(iv).toHaveLength(16);

      const sendInvoiceCall = calls.find(
        (c) => c.path === '/sessions/online/session-ref-1/invoices',
      );
      if (!sendInvoiceCall)
        throw new Error('expected a /sessions/online/session-ref-1/invoices call');
      const invoiceBody = sendInvoiceCall.body as {
        encryptedInvoiceContent: string;
        invoiceSize: number;
        encryptedInvoiceSize: number;
      };
      const decipher = createDecipheriv('aes-256-cbc', aesKey, iv);
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(invoiceBody.encryptedInvoiceContent, 'base64')),
        decipher.final(),
      ]);
      expect(decrypted.toString('utf8')).toBe(params.xml);
      expect(invoiceBody.invoiceSize).toBe(Buffer.byteLength(params.xml, 'utf8'));
    });

    it('propagates a 401 response with its real body instead of a fabricated result', async () => {
      installFetch(
        happyPathHandler({
          'GET /auth/auth-ref-1': () =>
            new Response(
              JSON.stringify({
                status: 401,
                title: 'Unauthorized',
                detail: 'invalid authentication token',
              }),
              { status: 401, headers: { 'content-type': 'application/problem+json' } },
            ),
        }),
      );
      const transport = new KsefTransport();

      await expect(transport.send(params)).rejects.toThrow(/401/);
      await expect(transport.send(params)).rejects.toThrow(/invalid authentication token/);
    });

    it('propagates a 5xx response with its real body', async () => {
      installFetch(
        happyPathHandler({
          'POST /sessions/online/session-ref-1/invoices': () =>
            new Response('upstream KSeF outage', { status: 503 }),
        }),
      );
      const transport = new KsefTransport();

      await expect(transport.send(params)).rejects.toThrow(/503/);
      await expect(transport.send(params)).rejects.toThrow(/upstream KSeF outage/);
    });
  });

  describe('checkStatus', () => {
    it('maps status code 150 to pending', async () => {
      installFetch(
        happyPathHandler({
          'GET /sessions/session-ref-1/invoices/invoice-ref-1': () =>
            jsonResponse(200, { status: { code: 150, description: 'Trwa przetwarzanie' } }),
        }),
      );
      const transport = new KsefTransport();

      const result = await transport.checkStatus('session-ref-1:invoice-ref-1');

      expect(result).toEqual({ status: 'pending' });
    });

    it('maps status code 200 to accepted and records the KSeF number and UPO reference', async () => {
      installFetch(
        happyPathHandler({
          'GET /sessions/session-ref-1/invoices/invoice-ref-1': () =>
            jsonResponse(200, {
              status: { code: 200, description: 'Sukces' },
              ksefNumber: '1234563218-20260911-010203040A-B1',
              upoDownloadUrl:
                'https://api-test.ksef.mf.gov.pl/v2/sessions/session-ref-1/upo/upo-ref-1',
            }),
        }),
      );
      const transport = new KsefTransport();

      const result = await transport.checkStatus('session-ref-1:invoice-ref-1');

      expect(result.status).toBe('accepted');
      expect(JSON.parse(result.receipt as string)).toEqual({
        ksefNumber: '1234563218-20260911-010203040A-B1',
        upoDownloadUrl: 'https://api-test.ksef.mf.gov.pl/v2/sessions/session-ref-1/upo/upo-ref-1',
      });
    });

    it('maps a documented failure code (440, duplicate invoice) to rejected with the real description', async () => {
      installFetch(
        happyPathHandler({
          'GET /sessions/session-ref-1/invoices/invoice-ref-1': () =>
            jsonResponse(200, {
              status: {
                code: 440,
                description: 'Duplikat faktury',
                details: ['originalKsefNumber=1234563218-20260910-010203040A-B0'],
              },
            }),
        }),
      );
      const transport = new KsefTransport();

      const result = await transport.checkStatus('session-ref-1:invoice-ref-1');

      expect(result.status).toBe('rejected');
      expect(result.errorText).toContain('Duplikat faktury');
      expect(result.errorText).toContain('originalKsefNumber');
    });

    it('rejects a malformed providerMessageId without calling the network', async () => {
      const { calls } = installFetch(happyPathHandler());
      const transport = new KsefTransport();

      await expect(transport.checkStatus('not-a-composite-id')).rejects.toThrow('malformed');
      expect(calls).toHaveLength(0);
    });

    it('throws without calling the network when not configured', async () => {
      delete process.env.KSEF_NIP;
      const { calls } = installFetch(happyPathHandler());
      const transport = new KsefTransport();

      await expect(transport.checkStatus('session-ref-1:invoice-ref-1')).rejects.toThrow(
        'not configured',
      );
      expect(calls).toHaveLength(0);
    });
  });
});
