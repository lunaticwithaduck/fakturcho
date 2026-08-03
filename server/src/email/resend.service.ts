import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import type { EmailSender, SendEmailInput } from './ports';

@Injectable()
export class ResendService implements EmailSender {
  private readonly client: Resend;
  private readonly from: string;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY ?? '');
    this.from = process.env.EMAIL_FROM ?? 'Fakturcho <invoices@fakturcho.bg>';
  }

  async send(input: SendEmailInput): Promise<void> {
    const result = await this.client.emails.send({
      from: this.from,
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
