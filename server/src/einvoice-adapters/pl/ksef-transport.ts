export interface KsefAuthResult {
  token: string;
}

export type KsefSubmitStatus = 'processing' | 'rejected';

export interface KsefSubmitResult {
  status: KsefSubmitStatus;
  ksefReferenceNumber?: string;
  errorText?: string;
}

export type KsefDocumentStatus = 'processing' | 'accepted' | 'rejected';

export interface KsefStatusResult {
  status: KsefDocumentStatus;
  ksefNumber?: string;
  qrCode?: string;
  errorText?: string;
}

export interface KsefTransport {
  readonly providerName: string;
  authenticate(): Promise<KsefAuthResult>;
  submit(xml: string, token: string): Promise<KsefSubmitResult>;
  checkStatus(referenceNumber: string): Promise<KsefStatusResult>;
}

export const KSEF_TRANSPORT = Symbol('KSEF_TRANSPORT');

function looksMalformed(xml: string): boolean {
  const trimmed = xml.trim();
  return trimmed === '' || !trimmed.startsWith('<') || !trimmed.endsWith('>');
}

interface PendingSubmission {
  polls: number;
}

export class MockKsefTransport implements KsefTransport {
  readonly providerName = 'mock-ksef';

  private sessionCounter = 0;
  private submissionCounter = 0;
  private readonly submissions = new Map<string, PendingSubmission>();

  async authenticate(): Promise<KsefAuthResult> {
    this.sessionCounter += 1;
    return { token: `mock-session-token-${this.sessionCounter}` };
  }

  async submit(xml: string, token: string): Promise<KsefSubmitResult> {
    if (!token) {
      return { status: 'rejected', errorText: 'missing or expired KSeF session token' };
    }
    if (looksMalformed(xml)) {
      return { status: 'rejected', errorText: 'FA(3) XML payload is empty or malformed' };
    }

    this.submissionCounter += 1;
    const ksefReferenceNumber = `mock-ref-${this.submissionCounter}`;
    this.submissions.set(ksefReferenceNumber, { polls: 0 });
    return { status: 'processing', ksefReferenceNumber };
  }

  async checkStatus(referenceNumber: string): Promise<KsefStatusResult> {
    const record = this.submissions.get(referenceNumber);
    if (!record) {
      return { status: 'rejected', errorText: 'unknown KSeF reference number' };
    }

    record.polls += 1;
    if (record.polls < 2) {
      return { status: 'processing' };
    }

    const ksefNumber = buildMockKsefNumber(referenceNumber);
    return { status: 'accepted', ksefNumber, qrCode: buildMockQrCode(ksefNumber) };
  }
}

function buildMockKsefNumber(referenceNumber: string): string {
  const sequence = referenceNumber.replace(/\D/g, '').padStart(6, '0');
  return `1000000000-20260909-${sequence}-A1`;
}

function buildMockQrCode(ksefNumber: string): string {
  return `mock-qr:${ksefNumber}`;
}
