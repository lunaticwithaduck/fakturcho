import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import type { EmailSender, SendEmailInput } from './ports';

// RFC 5322 atext plus the space that separates words in an unquoted phrase.
const UNQUOTED_DISPLAY_NAME = /^[\x21-\x7e ]*$/;
const NEEDS_QUOTING = /["\\,()<>[\]:;@]/;
const NON_ASCII = /[^\x20-\x7e]/;

function quote(name: string): string {
  return `"${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// Formats a From/Reply-To display name per RFC 5322 §3.2.3 (quoted-string for
// ASCII names with commas/quotes/etc.) and RFC 2047 (encoded-word for
// non-ASCII, e.g. Cyrillic issuer names).
function encodeDisplayName(name: string): string {
  if (NON_ASCII.test(name)) {
    return `=?UTF-8?B?${Buffer.from(name, 'utf8').toString('base64')}?=`;
  }
  if (UNQUOTED_DISPLAY_NAME.test(name) && !NEEDS_QUOTING.test(name)) return name;
  return quote(name);
}

function formatSender(displayName: string, address: string): string {
  return `${encodeDisplayName(displayName)} <${address}>`;
}

function addressFromEnv(fromEnv: string): string {
  const match = fromEnv.match(/<([^>]+)>/);
  return match?.[1] ?? fromEnv.trim();
}

@Injectable()
export class ResendService implements EmailSender {
  private readonly client: Resend;
  private readonly senderAddress: string;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY ?? '');
    this.senderAddress = addressFromEnv(
      process.env.EMAIL_FROM ?? 'Fakturcho <invoices@fakturcho.bg>',
    );
  }

  async send(input: SendEmailInput): Promise<void> {
    const displayName = input.issuerName ? `${input.issuerName} via Fakturcho` : 'Fakturcho';
    const result = await this.client.emails.send({
      from: formatSender(displayName, this.senderAddress),
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      attachments: [{ filename: input.attachment.filename, content: input.attachment.content }],
    });
    if (result.error) {
      throw new Error(`Resend failed to send email: ${result.error.message}`);
    }
  }
}
