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
import type {
  PeppolLookupResult,
  PeppolSendParams,
  PeppolSendResult,
  PeppolTransport,
} from '../peppol-transport.interface';
import { EinvoiceSendService } from './einvoice-send.service';

class ScriptedPeppolTransport implements PeppolTransport {
  readonly providerName = 'scripted';

  private callCount = 0;

  constructor(private readonly results: PeppolSendResult[]) {}

  async send(_params: PeppolSendParams): Promise<PeppolSendResult> {
    const index = Math.min(this.callCount, this.results.length - 1);
    const result = this.results[index];
    this.callCount += 1;
    if (!result) {
      throw new Error('ScriptedPeppolTransport requires at least one scripted result');
    }
    return result;
  }

  async lookupParticipant(): Promise<PeppolLookupResult> {
    return { registered: true };
  }
}

describe('EinvoiceSendService', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let prismaService: PrismaService;
  let documentsService: DocumentsService;
  let issuanceService: DocumentIssuanceService;
  let einvoiceSendService: EinvoiceSendService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    prismaService = prisma as unknown as PrismaService;
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

  async function issueDocumentForPeppolClient(accountId: string) {
    const client = await createPeppolClient(accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    return issuanceService.issue(accountId, draft.id, {});
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

  it('creates an EinvoiceTransmission row with retryCount 0 for a fresh send', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const issued = await issueDocumentForPeppolClient(accountId);

    const transmission = await einvoiceSendService.send(accountId, issued.id);

    expect(transmission.status).toBe('SENT');
    expect(transmission.provider).toBe('mock');
    expect(transmission.documentId).toBe(issued.id);
    expect(transmission.retryCount).toBe(0);

    const stored = await prisma.einvoiceTransmission.findUnique({
      where: { documentId: issued.id },
    });
    expect(stored?.status).toBe('SENT');
    expect(stored?.retryCount).toBe(0);
  });

  it('refuses to resend a transmission that already succeeded, without duplicating the row', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const issued = await issueDocumentForPeppolClient(accountId);

    const first = await einvoiceSendService.send(accountId, issued.id);
    expect(first.status).toBe('SENT');

    await expect(einvoiceSendService.send(accountId, issued.id)).rejects.toThrow(DomainError);

    const rows = await prisma.einvoiceTransmission.findMany({
      where: { documentId: issued.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.retryCount).toBe(0);
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
    const issued = await issueDocumentForPeppolClient(accountId);
    await einvoiceSendService.send(accountId, issued.id);

    const transmission = await einvoiceSendService.getTransmission(accountId, issued.id);
    expect(transmission?.status).toBe('SENT');
    expect(transmission?.provider).toBe('mock');
  });

  it('increments retryCount when resending a REJECTED transmission', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const issued = await issueDocumentForPeppolClient(accountId);

    const rejectingService = new EinvoiceSendService(
      prismaService,
      documentsService,
      new PeppolService(
        new ScriptedPeppolTransport([
          { providerMessageId: '', status: 'rejected', errorText: 'peer unreachable' },
        ]),
      ),
    );

    const first = await rejectingService.send(accountId, issued.id);
    expect(first.status).toBe('REJECTED');
    expect(first.retryCount).toBe(0);

    const second = await rejectingService.send(accountId, issued.id);
    expect(second.status).toBe('REJECTED');
    expect(second.retryCount).toBe(1);
  });

  it('reaches the retry cap after three rejected resends and refuses a fourth attempt', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const issued = await issueDocumentForPeppolClient(accountId);

    const rejectingService = new EinvoiceSendService(
      prismaService,
      documentsService,
      new PeppolService(
        new ScriptedPeppolTransport([
          { providerMessageId: '', status: 'rejected', errorText: 'peer unreachable' },
        ]),
      ),
    );

    await rejectingService.send(accountId, issued.id);
    await rejectingService.send(accountId, issued.id);
    await rejectingService.send(accountId, issued.id);
    const fourthAttempt = await rejectingService.send(accountId, issued.id);

    expect(fourthAttempt.retryCount).toBe(3);

    await expect(rejectingService.send(accountId, issued.id)).rejects.toThrow(DomainError);

    const stored = await prisma.einvoiceTransmission.findUnique({
      where: { documentId: issued.id },
    });
    expect(stored?.status).toBe('REJECTED');
    expect(stored?.retryCount).toBe(3);
  });
});
