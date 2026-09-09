import type { DocumentType, EmailDocumentRequest } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { type Locale, resolveEmailLocale } from './locale';
import { type DocumentRenderer, EMAIL_SENDER, type EmailSender, RENDER_SERVICE } from './ports';
import { buildDocumentSubject } from './subject-templates';

function buildSubject(
  locale: Locale,
  documentType: string,
  numberPrefix: string | null,
  number: bigint | null,
  numberSuffix: string | null,
): string {
  // Prisma's enum values (INVOICE, CREDIT_NOTE, ...) are the uppercase form of
  // shared-types' DocumentType (invoice, credit_note, ...) by construction.
  const type = documentType.toLowerCase() as DocumentType;
  if (number === null) return buildDocumentSubject(locale, type, null);
  const formatted = `${numberPrefix ?? ''}${formatDocumentNumber(Number(number))}${numberSuffix ?? ''}`;
  return buildDocumentSubject(locale, type, formatted);
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
    const locale = resolveEmailLocale(
      document.documentLanguage,
      document.issuerCountry,
      document.recipientCountry,
    );
    const subject = buildSubject(
      locale,
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
      locale,
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: { emailText: body.emailText, emailedAt: new Date() },
    });
  }
}
