import type { DocumentType, EmailDocumentRequest } from '@fakturcho/shared-types';
import { DOCUMENT_TYPE_LABELS, formatDocumentNumber } from '@fakturcho/shared-types';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { type DocumentRenderer, EMAIL_SENDER, type EmailSender, RENDER_SERVICE } from './ports';

function buildSubject(
  documentType: string,
  numberPrefix: string | null,
  number: bigint | null,
  numberSuffix: string | null,
): string {
  // Prisma's enum values (INVOICE, CREDIT_NOTE, ...) are the uppercase form of
  // shared-types' DocumentType (invoice, credit_note, ...) by construction.
  const label = DOCUMENT_TYPE_LABELS[documentType.toLowerCase() as DocumentType];
  if (number === null) return label;
  const formatted = `${numberPrefix ?? ''}${formatDocumentNumber(Number(number))}${numberSuffix ?? ''}`;
  return `${label} № ${formatted}`;
}

@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RENDER_SERVICE) private readonly renderer: DocumentRenderer,
    @Inject(EMAIL_SENDER) private readonly sender: EmailSender,
  ) {}

  async sendDocumentEmail(
    accountId: string,
    documentId: string,
    body: EmailDocumentRequest,
  ): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, accountId },
    });
    if (!document) throw new DomainError('NOT_FOUND', 'Document not found');
    if (document.status === 'DRAFT' || document.number === null) {
      throw new DomainError('DOCUMENT_NOT_ISSUED', 'A draft cannot be emailed. Issue it first.');
    }

    const rendered = await this.renderer.renderPdf(documentId, accountId);
    const subject = buildSubject(
      document.documentType,
      document.numberPrefix,
      document.number,
      document.numberSuffix,
    );

    await this.sender.send({
      to: body.to,
      subject,
      text: body.emailText,
      attachment: { filename: rendered.filename, content: rendered.buffer },
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: { emailText: body.emailText, emailedAt: new Date() },
    });
  }
}
