import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { type Browser, chromium } from 'playwright';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { resolveVatPresentation } from '../money/vat';
import { buildDownloadFilename } from './content-disposition';
import { isDualDisplayActive } from './dual-display';
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

  constructor(private readonly prisma: PrismaService) {}

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
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
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

    const html = renderClassicTemplateHtml({
      document,
      lineItems: document.lineItems,
      presentation,
      dualDisplayActive: isDualDisplayActive(),
      isDraft,
    });

    const buffer = await this.renderHtmlToPdf(html);
    const number = document.number === null ? null : Number(document.number);
    const filename = buildDownloadFilename(documentType, isDraft, number);

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
