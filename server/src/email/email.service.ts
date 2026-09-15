import type { DocumentType, EmailDocumentRequest } from '@fakturcho/shared-types';
import { formatDocumentNumber } from '@fakturcho/shared-types';
import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '../common/domain-error';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { resolveEffectiveDocumentLanguage } from '../render/language';
import type { Locale } from './locale';
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
    private readonly flags: FeatureFlagsService = new FeatureFlagsService(prisma),
  ) {}

  async sendDocumentEmail(
    accountId: string,
    documentId: string,
    body: EmailDocumentRequest,
  ): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, accountId },
      include: { account: { include: { users: { take: 1 } } } },
    });
    if (!document) throw new DomainError('NOT_FOUND', 'Document not found');
    if (document.status === 'DRAFT' || document.number === null) {
      throw new DomainError('DOCUMENT_NOT_ISSUED', 'A draft cannot be emailed. Issue it first.');
    }
    const userEmail = document.account.users[0]?.email;
    if (!userEmail) {
      throw new DomainError(
        'VALIDATION_FAILED',
        'This account has no user email to reply to. Add a user before emailing documents.',
      );
    }

    const rendered = await this.renderer.renderPdf(documentId, accountId);
    const enLocale = await this.flags.isEnabled('EN_LOCALE');
    // Emailing is guarded above to issued documents only, so this is never a draft and
    // the live issuer profile is never consulted (rule: an issued document with no
    // country snapshot predates the EU scope and resolves to bg, not the recipient).
    const locale: Locale = enLocale ? resolveEffectiveDocumentLanguage(document, null) : 'bg';
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
      issuerName: document.issuerCompanyName,
      replyTo: userEmail,
    });

    await this.prisma.document.update({
      where: { id: documentId },
      data: { emailText: body.emailText, emailedAt: new Date() },
    });
  }
}
