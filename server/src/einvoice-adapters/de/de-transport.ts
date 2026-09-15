import { Injectable } from '@nestjs/common';

export interface XRechnungSendParams {
  documentId: string;
  recipientEmail: string;
  xrechnungXml: string;
  attachmentFileName: string;
}

export interface XRechnungSendResult {
  status: 'sent' | 'rejected';
  providerMessageId?: string;
  errorText?: string;
}

export interface XRechnungTransport {
  readonly channel: string;
  send(params: XRechnungSendParams): Promise<XRechnungSendResult>;
}

export const XRECHNUNG_TRANSPORT = Symbol('XRECHNUNG_TRANSPORT');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function looksMalformed(xml: string): boolean {
  const trimmed = xml.trim();
  return trimmed === '' || !trimmed.startsWith('<') || !trimmed.endsWith('>');
}

@Injectable()
export class MockXRechnungTransport implements XRechnungTransport {
  readonly channel = 'email-attachment-mock';

  private counter = 0;

  async send(params: XRechnungSendParams): Promise<XRechnungSendResult> {
    if (looksMalformed(params.xrechnungXml)) {
      return { status: 'rejected', errorText: 'XRechnung XML payload is empty or malformed' };
    }
    if (!EMAIL_PATTERN.test(params.recipientEmail)) {
      return { status: 'rejected', errorText: 'recipient email address is not a valid address' };
    }
    this.counter += 1;
    return { status: 'sent', providerMessageId: `mock-de-${this.counter}` };
  }
}
