import type { DocumentDto } from '@fakturcho/shared-types';
import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CreditsService } from '../../billing/credits.service';
import { DomainError } from '../../common/domain-error';
import { DocumentIssuanceService } from '../../documents/document-issuance.service';
import type { DocumentsService } from '../../documents/documents.service';
import { DocumentsService as RealDocumentsService } from '../../documents/documents.service';
import {
  createAccount,
  createCompleteIssuerProfile,
  draftRequest,
} from '../../documents/test-support';
import { XRECHNUNG_CUSTOMIZATION_ID } from '../../einvoice-adapters/de/xrechnung-mapper';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NumberingService } from '../../numbering/numbering.service';
import type { TestDatabase } from '../../testing/test-database';
import { startTestDatabase } from '../../testing/test-database';
import { bgDomesticStandardInvoice } from '../__fixtures__/bg-domestic-standard';
import { deDomesticStandardInvoice } from '../__fixtures__/eu-domestic-standard';
import { EINVOICE_MISSING_FIELD_CODES } from '../readiness';
import { EinvoiceExportService } from './einvoice-export.service';

function stubDocumentsService(document: DocumentDto): DocumentsService {
  return { get: vi.fn().mockResolvedValue(document) } as unknown as DocumentsService;
}

describe('EinvoiceExportService', () => {
  it('exports a BG-issuer document as core UBL XML', async () => {
    const service = new EinvoiceExportService(stubDocumentsService(bgDomesticStandardInvoice));
    const xml = await service.getXml('acc-1', bgDomesticStandardInvoice.id);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Invoice')).toBe(true);
    expect(xml).not.toContain(XRECHNUNG_CUSTOMIZATION_ID);
  });

  it('exports a DE-issuer document as XRechnung-flavored XML', async () => {
    const service = new EinvoiceExportService(stubDocumentsService(deDomesticStandardInvoice));
    const xml = await service.getXml('acc-1', deDomesticStandardInvoice.id);
    expect(xml).toContain(
      `<cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    );
  });

  it('reports readiness for a complete issued document', async () => {
    const service = new EinvoiceExportService(stubDocumentsService(bgDomesticStandardInvoice));
    const result = await service.getReadiness('acc-1', bgDomesticStandardInvoice.id);
    expect(result).toEqual({ ready: true, missingFields: [] });
  });

  it('reports missing fields for an unissued document without throwing', async () => {
    const draft: DocumentDto = {
      ...bgDomesticStandardInvoice,
      status: 'draft',
      number: null,
      issuedAt: null,
    };
    const service = new EinvoiceExportService(stubDocumentsService(draft));
    const result = await service.getReadiness('acc-1', draft.id);
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain(EINVOICE_MISSING_FIELD_CODES.documentNumber);
  });

  it('rejects exporting a draft document with DOCUMENT_NOT_ISSUED, not a raw crash', async () => {
    const draft: DocumentDto = {
      ...bgDomesticStandardInvoice,
      status: 'draft',
      number: null,
      issuedAt: null,
    };
    const service = new EinvoiceExportService(stubDocumentsService(draft));

    await expect(service.getXml('acc-1', draft.id)).rejects.toBeInstanceOf(DomainError);
    await expect(service.getXml('acc-1', draft.id)).rejects.toMatchObject({
      code: 'DOCUMENT_NOT_ISSUED',
    });
  });

  it('rejects exporting a proforma document with a clean VALIDATION_FAILED domain error', async () => {
    const proforma: DocumentDto = { ...bgDomesticStandardInvoice, documentType: 'proforma' };
    const service = new EinvoiceExportService(stubDocumentsService(proforma));

    await expect(service.getXml('acc-1', proforma.id)).rejects.toBeInstanceOf(DomainError);
    await expect(service.getXml('acc-1', proforma.id)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('rejects exporting a quote document with a clean VALIDATION_FAILED domain error', async () => {
    const quote: DocumentDto = { ...bgDomesticStandardInvoice, documentType: 'quote' };
    const service = new EinvoiceExportService(stubDocumentsService(quote));

    await expect(service.getXml('acc-1', quote.id)).rejects.toBeInstanceOf(DomainError);
    await expect(service.getXml('acc-1', quote.id)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });
});

describe('EinvoiceExportService — account scoping and lifecycle (real database)', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let prismaService: PrismaService;
  let documentsService: RealDocumentsService;
  let issuanceService: DocumentIssuanceService;
  let service: EinvoiceExportService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    prismaService = prisma as unknown as PrismaService;
    documentsService = new RealDocumentsService(prismaService);
    issuanceService = new DocumentIssuanceService(
      prismaService,
      new NumberingService(prismaService),
      new CreditsService(prismaService),
    );
    service = new EinvoiceExportService(documentsService);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  async function issueDocument(accountId: string) {
    const draft = await documentsService.saveDraft(accountId, null, draftRequest());
    return issuanceService.issue(accountId, draft.id, {});
  }

  it("does not leak another account's document: readiness returns NOT_FOUND", async () => {
    const ownerAccountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, ownerAccountId);
    const issued = await issueDocument(ownerAccountId);

    const strangerAccountId = await createAccount(prisma);

    await expect(service.getReadiness(strangerAccountId, issued.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it("does not leak another account's document: xml export returns NOT_FOUND", async () => {
    const ownerAccountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, ownerAccountId);
    const issued = await issueDocument(ownerAccountId);

    const strangerAccountId = await createAccount(prisma);

    await expect(service.getXml(strangerAccountId, issued.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('returns NOT_FOUND for a document id that does not exist at all', async () => {
    const accountId = await createAccount(prisma);
    await expect(service.getXml(accountId, 'does-not-exist')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('rejects exporting a cancelled document with DOCUMENT_NOT_ISSUED', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const issued = await issueDocument(accountId);
    await issuanceService.cancel(accountId, issued.id);

    await expect(service.getXml(accountId, issued.id)).rejects.toMatchObject({
      code: 'DOCUMENT_NOT_ISSUED',
    });
  });
});
