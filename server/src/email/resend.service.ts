import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import type { Locale } from './locale';
import type { EmailSender, SendEmailInput } from './ports';

@Injectable()
export class ResendService implements EmailSender {
  private readonly client: Resend;
  private readonly fromByLocale: Record<Locale, string>;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY ?? '');
    this.fromByLocale = {
      bg:
        process.env.EMAIL_FROM_BG ?? process.env.EMAIL_FROM ?? 'Fakturcho <invoices@fakturcho.bg>',
      en: process.env.EMAIL_FROM_EN ?? 'Fakturcho <invoices@fakturcho.com>',
    };
  }

  async send(input: SendEmailInput): Promise<void> {
    const result = await this.client.emails.send({
      from: this.fromByLocale[input.locale],
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: [{ filename: input.attachment.filename, content: input.attachment.content }],
    });
    if (result.error) {
      throw new Error(`Resend failed to send email: ${result.error.message}`);
    }
  }
}
