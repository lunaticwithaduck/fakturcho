import type { Locale } from './locale';

export interface RenderedDocument {
  buffer: Buffer;
  filename: string;
}

export interface DocumentRenderer {
  renderPdf(documentId: string, accountId: string): Promise<RenderedDocument>;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  attachment: { filename: string; content: Buffer };
  locale: Locale;
}

export interface EmailSender {
  send(input: SendEmailInput): Promise<void>;
}

export const RENDER_SERVICE = Symbol('RENDER_SERVICE');
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
