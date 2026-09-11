import { Injectable, Logger } from '@nestjs/common';
import type {
  EinvoiceTransport,
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { AnafTokenCache } from './anaf-token';
import { parseMessageStateResponse, parseUploadResponse } from './anaf-xml';
import { extractRomanianCui } from './ro-cui';

const API_BASE: Record<'test' | 'prod', string> = {
  test: 'https://api.anaf.ro/test/FCTEL/rest',
  prod: 'https://api.anaf.ro/prod/FCTEL/rest',
};

function readEnvironment(): 'test' | 'prod' | undefined {
  const value = process.env.ANAF_ENVIRONMENT;
  return value === 'test' || value === 'prod' ? value : undefined;
}

@Injectable()
export class AnafTransport implements EinvoiceTransport {
  readonly providerName = 'anaf-efactura';
  readonly country = 'RO';

  private readonly logger = new Logger(AnafTransport.name);
  private readonly environment = readEnvironment();
  private readonly tokenCache: AnafTokenCache | null;

  constructor() {
    const clientId = process.env.ANAF_CLIENT_ID;
    const clientSecret = process.env.ANAF_CLIENT_SECRET;
    const refreshToken = process.env.ANAF_REFRESH_TOKEN;
    this.tokenCache =
      clientId && clientSecret && refreshToken
        ? new AnafTokenCache({ clientId, clientSecret, refreshToken })
        : null;
  }

  isConfigured(): boolean {
    return this.environment !== undefined && this.tokenCache !== null;
  }

  async send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult> {
    const base = this.requireBase();
    const cif = extractRomanianCui(params.document.issuer.eik ?? '');
    const url = `${base}/upload?standard=UBL&cif=${encodeURIComponent(cif)}`;

    const response = await this.authorizedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: params.xml,
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(
        `ANAF upload failed for document ${params.documentId}: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    const parsed = parseUploadResponse(body);
    if (parsed.executionStatus === 0 && parsed.uploadIndex) {
      return { providerMessageId: parsed.uploadIndex, status: 'sent' };
    }
    return {
      providerMessageId: parsed.uploadIndex ?? '',
      status: 'rejected',
      errorText:
        parsed.errors.join('; ') ||
        `ANAF rejected the upload (ExecutionStatus ${parsed.executionStatus ?? 'unknown'})`,
    };
  }

  async checkStatus(providerMessageId: string): Promise<EinvoiceTransportStatusResult> {
    const base = this.requireBase();
    const url = `${base}/stareMesaj?id_incarcare=${encodeURIComponent(providerMessageId)}`;

    const response = await this.authorizedFetch(url, { method: 'GET' });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(
        `ANAF stareMesaj failed for upload index ${providerMessageId}: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    const parsed = parseMessageStateResponse(body);
    if (parsed.state === 'in prelucrare') {
      return { status: 'pending' };
    }
    if (parsed.state === 'ok') {
      if (!parsed.downloadId) return { status: 'accepted' };
      const receipt = await this.fetchReceipt(base, parsed.downloadId);
      return { status: 'accepted', receipt };
    }
    return {
      status: 'rejected',
      errorText:
        parsed.errors.join('; ') || `ANAF reported message state "${parsed.state ?? 'unknown'}"`,
    };
  }

  private async fetchReceipt(base: string, downloadId: string): Promise<string> {
    const url = `${base}/descarcare?id=${encodeURIComponent(downloadId)}`;
    const response = await this.authorizedFetch(url, { method: 'GET' });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `ANAF descarcare failed for download id ${downloadId}: ${response.status} ${response.statusText} — ${body}`,
      );
    }
    return downloadId;
  }

  private requireBase(): string {
    if (!this.isConfigured() || this.environment === undefined) {
      throw new Error(
        'AnafTransport is not configured: set ANAF_ENVIRONMENT, ANAF_CLIENT_ID, ANAF_CLIENT_SECRET and ANAF_REFRESH_TOKEN.',
      );
    }
    return API_BASE[this.environment];
  }

  private async authorizedFetch(url: string, init: RequestInit): Promise<Response> {
    const tokenCache = this.tokenCache as AnafTokenCache;
    const accessToken = await tokenCache.getAccessToken();
    const first = await this.rawFetch(url, accessToken, init);
    if (first.status !== 401) return first;

    this.logger.warn(`ANAF returned 401 for ${url}, refreshing the access token and retrying once`);
    tokenCache.invalidate();
    const retryToken = await tokenCache.getAccessToken();
    return this.rawFetch(url, retryToken, init);
  }

  private async rawFetch(url: string, accessToken: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      throw new Error(`ANAF request to ${url} failed: ${(error as Error).message}`);
    }
  }
}
