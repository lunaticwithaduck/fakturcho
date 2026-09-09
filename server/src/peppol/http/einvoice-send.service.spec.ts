import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreditsService } from '../../billing/credits.service';
import { DomainError } from '../../common/domain-error';
import { DocumentIssuanceService } from '../../documents/document-issuance.service';
import { DocumentsService } from '../../documents/documents.service';
import {
  createAccount,
  createCompleteIssuerProfile,
  draftRequest,
} from '../../documents/test-support';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NumberingService } from '../../numbering/numbering.service';
import type { TestDatabase } from '../../testing/test-database';
import { startTestDatabase } from '../../testing/test-database';
import { MockPeppolTransport } from '../mock-peppol-transport';
import { PeppolService } from '../peppol.service';
import { EinvoiceSendService } from './einvoice-send.service';

describe('EinvoiceSendService', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let documentsService: DocumentsService;
  let issuanceService: DocumentIssuanceService;
  let einvoiceSendService: EinvoiceSendService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    const prismaService = prisma as unknown as PrismaService;
    documentsService = new DocumentsService(prismaService);
    issuanceService = new DocumentIssuanceService(
      prismaService,
      new NumberingService(prismaService),
      new CreditsService(prismaService),
    );
    einvoiceSendService = new EinvoiceSendService(
      prismaService,
      documentsService,
      new PeppolService(new MockPeppolTransport()),
    );
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  async function createPeppolClient(accountId: string, companyName = 'Клиент с Peppol') {
    return prisma.client.create({
      data: {
        accountId,
        companyName,
        peppolEndpointId: '0088:1234567890123',
        peppolScheme: '0088',
      },
    });
  }

  it('rejects sending when the client has no Peppol endpoint registered', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await prisma.client.create({
      data: { accountId, companyName: 'Без Peppol ООД' },
    });
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});

    await expect(einvoiceSendService.send(accountId, issued.id)).rejects.toThrow(DomainError);

    const stored = await prisma.einvoiceTransmission.findUnique({
      where: { documentId: issued.id },
    });
    expect(stored).toBeNull();
  });

  it('creates an EinvoiceTransmission row with the mock transport sent status for a properly configured issued document', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createPeppolClient(accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});

    const transmission = await einvoiceSendService.send(accountId, issued.id);

    expect(transmission.status).toBe('SENT');
    expect(transmission.provider).toBe('mock');
    expect(transmission.documentId).toBe(issued.id);

    const stored = await prisma.einvoiceTransmission.findUnique({
      where: { documentId: issued.id },
    });
    expect(stored?.status).toBe('SENT');
  });

  it('upserts the same row instead of duplicating it when sending the same document twice', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createPeppolClient(accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});

    const first = await einvoiceSendService.send(accountId, issued.id);
    const second = await einvoiceSendService.send(accountId, issued.id);

    expect(first.documentId).toBe(second.documentId);

    const rows = await prisma.einvoiceTransmission.findMany({
      where: { documentId: issued.id },
    });
    expect(rows).toHaveLength(1);
  });

  it('rejects sending a draft document', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createPeppolClient(accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );

    await expect(einvoiceSendService.send(accountId, draft.id)).rejects.toThrow(DomainError);
  });

  it('rejects sending an issued proforma document', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createPeppolClient(accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'proforma', clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});

    await expect(einvoiceSendService.send(accountId, issued.id)).rejects.toThrow(DomainError);
  });

  it('rejects sending an issued quote document', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createPeppolClient(accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'quote', clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});

    await expect(einvoiceSendService.send(accountId, issued.id)).rejects.toThrow(DomainError);
  });

  it('returns null from getTransmission when nothing has been sent yet', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createPeppolClient(accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});

    const transmission = await einvoiceSendService.getTransmission(accountId, issued.id);
    expect(transmission).toBeNull();
  });

  it('getTransmission reflects the row created by send', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createPeppolClient(accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});
    await einvoiceSendService.send(accountId, issued.id);

    const transmission = await einvoiceSendService.getTransmission(accountId, issued.id);
    expect(transmission?.status).toBe('SENT');
    expect(transmission?.provider).toBe('mock');
  });
});
