import { Injectable } from '@nestjs/common';

export interface SdiSubmitResult {
  status: 'accepted' | 'rejected';
  sdiIdentifier?: string;
  errorText?: string;
}

export type SdiDeliveryStatus = 'sent_to_sdi' | 'delivered' | 'rejected' | 'unknown';

export interface SdiStatusResult {
  status: SdiDeliveryStatus;
}

export interface SdiTransport {
  readonly intermediaryName: string;
  submit(xml: string): Promise<SdiSubmitResult>;
  checkStatus(sdiIdentifier: string): Promise<SdiStatusResult>;
}

export const SDI_TRANSPORT = Symbol('SDI_TRANSPORT');

function looksMalformed(xml: string): boolean {
  const trimmed = xml.trim();
  return (
    trimmed === '' ||
    !trimmed.startsWith('<?xml') ||
    !trimmed.includes('<p:FatturaElettronica') ||
    !trimmed.endsWith('</p:FatturaElettronica>')
  );
}

@Injectable()
export class MockSdiTransport implements SdiTransport {
  readonly intermediaryName = 'mock-intermediary';

  private counter = 0;
  private readonly notifications = new Map<string, SdiDeliveryStatus>();

  async submit(xml: string): Promise<SdiSubmitResult> {
    if (looksMalformed(xml)) {
      return {
        status: 'rejected',
        errorText: 'FatturaPA XML payload is empty or malformed',
      };
    }
    this.counter += 1;
    const sdiIdentifier = `mock-sdi-${this.counter}`;
    this.notifications.set(sdiIdentifier, 'sent_to_sdi');
    return { status: 'accepted', sdiIdentifier };
  }

  async checkStatus(sdiIdentifier: string): Promise<SdiStatusResult> {
    const current = this.notifications.get(sdiIdentifier);
    if (!current) return { status: 'unknown' };
    if (current === 'sent_to_sdi') {
      this.notifications.set(sdiIdentifier, 'delivered');
      return { status: 'delivered' };
    }
    return { status: current };
  }
}
