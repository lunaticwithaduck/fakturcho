export interface AnafAuthToken {
  accessToken: string;
  expiresAt: string;
}

export type AnafUploadStatus = 'uploaded' | 'rejected';

export interface AnafUploadResult {
  status: AnafUploadStatus;
  uploadIndex?: string;
  errorText?: string;
}

export type AnafProcessingStatus = 'processing' | 'accepted' | 'rejected';

export interface AnafStatusResult {
  status: AnafProcessingStatus;
  errorText?: string;
}

export interface AnafTransport {
  readonly providerName: string;
  authenticate(): Promise<AnafAuthToken>;
  upload(xml: string): Promise<AnafUploadResult>;
  checkStatus(uploadIndex: string): Promise<AnafStatusResult>;
}

export const ANAF_TRANSPORT = Symbol('ANAF_TRANSPORT');

function looksMalformed(xml: string): boolean {
  const trimmed = xml.trim();
  return trimmed === '' || !trimmed.startsWith('<') || !trimmed.endsWith('>');
}

interface TrackedUpload {
  pollCount: number;
  acceptsAfterPolls: number;
}

export class MockAnafTransport implements AnafTransport {
  readonly providerName = 'anaf-mock';

  private counter = 0;
  private readonly uploads = new Map<string, TrackedUpload>();

  async authenticate(): Promise<AnafAuthToken> {
    return {
      accessToken: 'mock-anaf-access-token',
      expiresAt: '2026-01-01T00:00:00.000Z',
    };
  }

  async upload(xml: string): Promise<AnafUploadResult> {
    if (looksMalformed(xml)) {
      return {
        status: 'rejected',
        errorText: 'UBL XML payload is empty or malformed',
      };
    }

    this.counter += 1;
    const uploadIndex = `mock-upload-${this.counter}`;
    this.uploads.set(uploadIndex, { pollCount: 0, acceptsAfterPolls: 2 });

    return { status: 'uploaded', uploadIndex };
  }

  async checkStatus(uploadIndex: string): Promise<AnafStatusResult> {
    const tracked = this.uploads.get(uploadIndex);
    if (!tracked) {
      return {
        status: 'rejected',
        errorText: `unknown upload index "${uploadIndex}"`,
      };
    }

    tracked.pollCount += 1;
    if (tracked.pollCount < tracked.acceptsAfterPolls) {
      return { status: 'processing' };
    }

    return { status: 'accepted' };
  }
}
