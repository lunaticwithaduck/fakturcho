import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { Client, IssuerProfile } from '@prisma/client';
import { type Browser, chromium } from 'playwright';
import { DomainError } from '../common/domain-error';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { resolveVatPresentation } from '../money/vat';
import { buildDownloadFilename } from './content-disposition';
import { buildVerifactuQr } from './es-verifactu-qr.builder';
import { resolveDocumentIssuerCountry, resolveDocumentLanguage } from './language';
import { resolveOriginalDocumentRef } from './original-document-ref';
import { buildKsefQr } from './pl-ksef-qr.builder';
import { toSharedDocumentType } from './prisma-mappers';
import { renderClassicTemplateHtml } from './templates/classic/template';

export interface RenderedPdf {
  buffer: Buffer;
  filename: string;
  isDraft: boolean;
}

// A draft has no issuer/client snapshot yet (SPEC §4: snapshots are taken at
// issuance) — mirrors the exact mapping document-issuance.service.ts writes
// at issuance, so a draft preview matches the PDF the document will render
// once issued.
function liveIssuerSnapshotFields(profile: IssuerProfile | null) {
  return {
    issuerCompanyName: profile?.companyName ?? null,
    issuerEik: profile?.eik ?? null,
    issuerMol: profile?.mol ?? null,
    issuerAddressLine: profile?.addressLine ?? null,
    issuerStreet: profile?.street ?? null,
    issuerPostcode: profile?.postcode ?? null,
    issuerCountyRegion: profile?.countyRegion ?? null,
    issuerCity: profile?.city ?? null,
    issuerCountry: profile?.country ?? null,
    issuerPhone: profile?.phone ?? null,
    issuerVatRegistered: profile?.vatRegistered ?? false,
    issuerVatNumber: profile?.vatNumber ?? null,
    issuerBankName: profile?.bankName ?? null,
    issuerIban: profile?.iban ?? null,
    issuerBic: profile?.bic ?? null,
    issuerAltIban: profile?.altIban ?? null,
    issuerIdentifiers: profile?.identifiers ?? null,
    issuerVatOnCashBasis: profile?.vatOnCashBasis ?? false,
    issuerVatOnDebits: profile?.vatOnDebits ?? false,
  };
}

function liveRecipientSnapshotFields(client: Client | null) {
  return {
    recipientCompanyName: client?.companyName ?? null,
    recipientEik: client?.eik ?? null,
    recipientVatNumber: client?.vatNumber ?? null,
    recipientAddress: client?.address ?? null,
    recipientStreet: client?.street ?? null,
    recipientPostcode: client?.postcode ?? null,
    recipientCountyRegion: client?.countyRegion ?? null,
    recipientCity: client?.city ?? null,
    recipientCountry: client?.country ?? null,
    recipientEmail: client?.email ?? null,
    recipientMol: client?.mol ?? null,
    recipientSdiRecipientCode: client?.sdiRecipientCode ?? null,
    recipientPec: client?.pec ?? null,
  };
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
    const isDraft = document.status === 'DRAFT' || document.number === null;

    // A draft has no issuer/client snapshot yet (§4: snapshots are taken at
    // issuance) — every issuer/recipient field on `document` is still null, so
    // the preview must borrow the live issuer profile and live client, the
    // same way it already borrowed the issuer's country. An issued document
    // keeps its own snapshot only; it never joins back to live data.
    const liveIssuerProfile = isDraft
      ? await this.prisma.issuerProfile.findUnique({ where: { accountId } })
      : null;
    const liveClient =
      isDraft && document.clientId
        ? await this.prisma.client.findFirst({ where: { id: document.clientId, accountId } })
        : null;
    const effectiveDocument = isDraft
      ? {
          ...document,
          ...liveIssuerSnapshotFields(liveIssuerProfile),
          ...liveRecipientSnapshotFields(liveClient),
        }
      : document;

    const presentation = resolveVatPresentation({
      vatRegistered: effectiveDocument.issuerVatRegistered ?? false,
      vatRateBp: effectiveDocument.vatRateBp,
      vatExemptionGround: effectiveDocument.vatExemptionGround,
      documentType,
    });

    const enLocale = await this.flags.isEnabled('EN_LOCALE');
    // An issued document with a null issuerCountry predates the EU scope and must
    // never join back to the live profile; it resolves to BG.
    const liveIssuerCountry = liveIssuerProfile?.country ?? null;
    const issuerCountry = resolveDocumentIssuerCountry(document, liveIssuerCountry);
    const language = enLocale
      ? resolveDocumentLanguage(document.documentLanguage, issuerCountry)
      : 'bg';

    const originalDocument = await resolveOriginalDocumentRef(
      this.prisma,
      accountId,
      document.originalDocumentId,
      documentType,
    );

    const [ksefQr, verifactuQr] = await Promise.all([
      buildKsefQr(this.prisma, accountId, document, documentType, issuerCountry, isDraft),
      buildVerifactuQr(document, documentType, issuerCountry, isDraft),
    ]);

    const html = renderClassicTemplateHtml({
      document: effectiveDocument,
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
