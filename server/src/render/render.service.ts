import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { type Browser, chromium } from 'playwright';
import { DomainError } from '../common/domain-error';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { resolveVatPresentation } from '../money/vat';
import { buildDownloadFilename } from './content-disposition';
import { buildVerifactuQr } from './es-verifactu-qr.builder';
import { resolveDocumentIssuerCountry, resolveDocumentLanguage } from './language';
import { buildKsefQr } from './pl-ksef-qr.builder';
import { toSharedDocumentType } from './prisma-mappers';
import { renderClassicTemplateHtml } from './templates/classic/template';

export interface RenderedPdf {
  buffer: Buffer;
  filename: string;
  isDraft: boolean;
}

@Injectable()
export class RenderService implements OnModuleInit, OnModuleDestroy {
  private browser: Browser | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService = new FeatureFlagsService(prisma),
  ) {}

  async onModuleInit(): Promise<void> {
    this.browser = await chromium.launch();
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }

  async renderPdf(documentId: string, accountId: string): Promise<RenderedPdf> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, accountId },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        discounts: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!document) {
      throw new DomainError('NOT_FOUND', 'Document not found.');
    }

    const documentType = toSharedDocumentType(document.documentType);
    const presentation = resolveVatPresentation({
      vatRegistered: document.issuerVatRegistered ?? false,
      vatRateBp: document.vatRateBp,
      vatExemptionGround: document.vatExemptionGround,
      documentType,
    });

    const isDraft = document.status === 'DRAFT' || document.number === null;
    const enLocale = await this.flags.isEnabled('EN_LOCALE');
    // A draft has no issuer snapshot yet (§4: snapshots are taken at issuance), so
    // document.issuerCountry is still null — fall back to the account's own issuer
    // profile so a draft preview renders in the account's language, not always BG.
    // An issued document with a null issuerCountry predates the EU scope and must
    // never join back to the live profile; it resolves to BG.
    const liveIssuerCountry = isDraft
      ? ((
          await this.prisma.issuerProfile.findUnique({
            where: { accountId },
            select: { country: true },
          })
        )?.country ?? null)
      : null;
    const issuerCountry = resolveDocumentIssuerCountry(document, liveIssuerCountry);
    const language = enLocale
      ? resolveDocumentLanguage(document.documentLanguage, issuerCountry)
      : 'bg';

    const isCorrection = documentType === 'credit_note' || documentType === 'debit_note';
    const originalDocument =
      isCorrection && document.originalDocumentId
        ? await this.prisma.document.findFirst({
            where: { id: document.originalDocumentId, accountId },
            select: { number: true, numberPrefix: true, numberSuffix: true, issuedAt: true },
          })
        : null;

    const [ksefQr, verifactuQr] = await Promise.all([
      buildKsefQr(this.prisma, accountId, document, documentType, issuerCountry, isDraft),
      buildVerifactuQr(document, documentType, issuerCountry, isDraft),
    ]);

    const html = renderClassicTemplateHtml({
      document,
      lineItems: document.lineItems,
      discounts: document.discounts,
      presentation,
      isDraft,
      language,
      issuerCountry,
      originalDocument,
      ksefQr,
      verifactuQr,
    });

    const buffer = await this.renderHtmlToPdf(html);
    const number = document.number === null ? null : Number(document.number);
    const filename = buildDownloadFilename(documentType, isDraft, number, language);

    return { buffer, filename, isDraft };
  }

  private async renderHtmlToPdf(html: string): Promise<Buffer> {
    if (!this.browser) {
      this.browser = await chromium.launch();
    }
    const page = await this.browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle' });
      return await page.pdf({ format: 'A4', printBackground: true });
    } finally {
      await page.close();
    }
  }
}
