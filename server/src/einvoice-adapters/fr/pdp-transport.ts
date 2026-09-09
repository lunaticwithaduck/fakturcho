export type PdpTransmissionStatus = 'sent' | 'rejected';
export type PdpStatus = 'pending' | 'delivered' | 'rejected' | 'unknown';

export interface PdpSubmitResult {
  status: PdpTransmissionStatus;
  transmissionId?: string;
  errorText?: string;
}

export interface PdpStatusResult {
  status: PdpStatus;
}

/**
 * France requires receipt through a certified PDP (Plateforme de
 * Dématérialisation Partenaire). There is no single PDP: each customer
 * picks one of several certified providers, so this interface models the
 * shared submission/status contract rather than any one vendor's API.
 */
export interface PdpTransport {
  readonly providerName: string;
  submit(xml: string): Promise<PdpSubmitResult>;
  checkStatus(transmissionId: string): Promise<PdpStatusResult>;
}

export const PDP_TRANSPORT = Symbol('PDP_TRANSPORT');

function looksMalformed(xml: string): boolean {
  const trimmed = xml.trim();
  return trimmed === '' || !trimmed.startsWith('<') || !trimmed.endsWith('>');
}

export class MockPdpTransport implements PdpTransport {
  readonly providerName = 'mock';

  private counter = 0;
  private readonly transmissions = new Map<string, PdpStatus>();

  async submit(xml: string): Promise<PdpSubmitResult> {
    if (looksMalformed(xml)) {
      return {
        status: 'rejected',
        errorText: 'PDP submission payload is empty or malformed',
      };
    }
    this.counter += 1;
    const transmissionId = `mock-pdp-${this.counter}`;
    this.transmissions.set(transmissionId, 'delivered');
    return { status: 'sent', transmissionId };
  }

  async checkStatus(transmissionId: string): Promise<PdpStatusResult> {
    const status = this.transmissions.get(transmissionId);
    return { status: status ?? 'unknown' };
  }
}
