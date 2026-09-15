import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type {
  EinvoiceTransport,
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { type AccessTokenState, authenticateWithKsefToken, refreshAccessToken } from './ksef-auth';
import { apiBase, ksefRequest, resolveEnvironment } from './ksef-client';
import { fetchPublicKeyCertificate, rsaOaepEncrypt } from './ksef-crypto';

const FORM_CODE = { systemCode: 'FA', schemaVersion: '1-0E', value: 'FA' } as const;

interface SessionInvoiceStatusResponse {
  ksefNumber?: string | null;
  upoDownloadUrl?: string | null;
  status: { code: number; description: string; details?: string[] | null };
}

// https://github.com/CIRFMF/ksef-api/blob/main/faktury/sesje/sesja-sprawdzenie-stanu-i-pobranie-upo.md
const INVOICE_STATUS_PENDING = new Set([100, 150]);
const INVOICE_STATUS_ACCEPTED = 200;

@Injectable()
export class KsefTransport implements EinvoiceTransport {
  readonly providerName = 'ksef';
  readonly country = 'PL';

  private readonly logger = new Logger(KsefTransport.name);
  private tokenState: AccessTokenState | null = null;

  isConfigured(): boolean {
    return Boolean(
      resolveEnvironment(process.env.KSEF_ENVIRONMENT) &&
        process.env.KSEF_NIP &&
        process.env.KSEF_TOKEN,
    );
  }

  async send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult> {
    if (!this.isConfigured()) throw new Error('KSeF transport is not configured');
    const baseUrl = this.baseUrl();
    const accessToken = await this.getAccessToken();

    const symmetricKeyCert = await fetchPublicKeyCertificate(baseUrl, 'SymmetricKeyEncryption');
    const aesKey = randomBytes(32);
    const iv = randomBytes(16);

    const openResponse = await ksefRequest<{ referenceNumber: string }>(
      baseUrl,
      'POST',
      '/sessions/online',
      {
        accessToken,
        body: {
          formCode: FORM_CODE,
          encryption: {
            encryptedSymmetricKey: rsaOaepEncrypt(aesKey, symmetricKeyCert).toString('base64'),
            initializationVector: iv.toString('base64'),
          },
        },
      },
    );
    const sessionReferenceNumber = openResponse.referenceNumber;

    const plaintext = Buffer.from(params.xml, 'utf8');
    const cipher = createCipheriv('aes-256-cbc', aesKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    const sendResponse = await ksefRequest<{ referenceNumber: string }>(
      baseUrl,
      'POST',
      `/sessions/online/${sessionReferenceNumber}/invoices`,
      {
        accessToken,
        body: {
          invoiceHash: createHash('sha256').update(plaintext).digest('base64'),
          invoiceSize: plaintext.byteLength,
          encryptedInvoiceHash: createHash('sha256').update(encrypted).digest('base64'),
          encryptedInvoiceSize: encrypted.byteLength,
          encryptedInvoiceContent: encrypted.toString('base64'),
        },
      },
    );
    const invoiceReferenceNumber = sendResponse.referenceNumber;

    await ksefRequest(baseUrl, 'POST', `/sessions/online/${sessionReferenceNumber}/close`, {
      accessToken,
    });

    return {
      providerMessageId: `${sessionReferenceNumber}:${invoiceReferenceNumber}`,
      status: 'sent',
    };
  }

  async checkStatus(providerMessageId: string): Promise<EinvoiceTransportStatusResult> {
    if (!this.isConfigured()) throw new Error('KSeF transport is not configured');
    const [sessionReferenceNumber, invoiceReferenceNumber] = providerMessageId.split(':');
    if (!sessionReferenceNumber || !invoiceReferenceNumber) {
      throw new Error(`malformed KSeF providerMessageId "${providerMessageId}"`);
    }

    const accessToken = await this.getAccessToken();
    const status = await ksefRequest<SessionInvoiceStatusResponse>(
      this.baseUrl(),
      'GET',
      `/sessions/${sessionReferenceNumber}/invoices/${invoiceReferenceNumber}`,
      { accessToken },
    );

    if (INVOICE_STATUS_PENDING.has(status.status.code)) {
      return { status: 'pending' };
    }
    if (status.status.code === INVOICE_STATUS_ACCEPTED) {
      return {
        status: 'accepted',
        receipt: JSON.stringify({
          ksefNumber: status.ksefNumber ?? null,
          upoDownloadUrl: status.upoDownloadUrl ?? null,
        }),
      };
    }
    return {
      status: 'rejected',
      errorText: [status.status.description, ...(status.status.details ?? [])].join(' — '),
    };
  }

  private baseUrl(): string {
    const environment = resolveEnvironment(process.env.KSEF_ENVIRONMENT);
    if (!environment) throw new Error('KSEF_ENVIRONMENT must be one of test, demo, prod');
    return apiBase(environment);
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenState && this.tokenState.accessTokenValidUntil > now + 30_000) {
      return this.tokenState.accessToken;
    }
    if (this.tokenState && this.tokenState.refreshTokenValidUntil > now + 30_000) {
      try {
        const refreshed = await refreshAccessToken(this.baseUrl(), this.tokenState.refreshToken);
        this.tokenState = { ...this.tokenState, ...refreshed };
        return this.tokenState.accessToken;
      } catch (err) {
        this.logger.warn(`KSeF token refresh failed, re-authenticating: ${(err as Error).message}`);
      }
    }

    this.tokenState = await authenticateWithKsefToken(
      this.baseUrl(),
      process.env.KSEF_NIP ?? '',
      process.env.KSEF_TOKEN ?? '',
    );
    return this.tokenState.accessToken;
  }
}
