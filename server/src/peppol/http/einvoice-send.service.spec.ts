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
import type {
  EinvoiceTransport,
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { EinvoiceTransportRegistry } from '../../einvoice/transport/transport-registry';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NumberingService } from '../../numbering/numbering.service';
import type { TestDatabase } from '../../testing/test-database';
import { startTestDatabase } from '../../testing/test-database';
import { PeppolService } from '../peppol.service';
import type {
  PeppolLookupResult,
  PeppolSendParams,
  PeppolSendResult,
  PeppolTransport,
} from '../peppol-transport.interface';
import { MockPeppolTransport } from '../testing/mock-peppol-transport';
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

interface FakeTransportHandle extends EinvoiceTransport {
  captured?: EinvoiceTransportSendParams;
}

function fakeEinvoiceTransport(options: {
  providerName: string;
  country: string;
  configured?: boolean;
  result?: EinvoiceTransportSendResult;
  statusResults?: EinvoiceTransportStatusResult[];
}): FakeTransportHandle {
  let statusCallCount = 0;
  const statusResults = options.statusResults ?? [];

  const transport: FakeTransportHandle = {
    providerName: options.providerName,
    country: options.country,
    isConfigured: () => options.configured ?? true,
    async send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult> {
      transport.captured = params;
      return options.result ?? { providerMessageId: 'fake-1', status: 'sent' };
    },
  };

  if (statusResults.length === 0) return transport;

  transport.checkStatus = async (
    _providerMessageId: string,
  ): Promise<EinvoiceTransportStatusResult> => {
    const index = Math.min(statusCallCount, statusResults.length - 1);
    const status = statusResults[index];
    statusCallCount += 1;
    if (!status) throw new Error('fakeEinvoiceTransport requires at least one status result');
    return status;
  };

  return transport;
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
    einvoiceSendService = buildService(new MockPeppolTransport(), []);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  function buildService(
    peppolTransport: PeppolTransport,
    transports: EinvoiceTransport[],
  ): EinvoiceSendService {
    return new EinvoiceSendService(
      prismaService,
      documentsService,
      new PeppolService(peppolTransport),
      new EinvoiceTransportRegistry(transports),
    );
  }

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

  it('rejects sending a cancelled document', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const issued = await issueDocumentForPeppolClient(accountId);
    await issuanceService.cancel(accountId, issued.id);

    await expect(einvoiceSendService.send(accountId, issued.id)).rejects.toThrow(DomainError);

    const stored = await prisma.einvoiceTransmission.findUnique({
      where: { documentId: issued.id },
    });
    expect(stored).toBeNull();
  });

  it("does not leak another account's document: send returns NOT_FOUND", async () => {
    const ownerAccountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, ownerAccountId);
    const issued = await issueDocumentForPeppolClient(ownerAccountId);

    const strangerAccountId = await createAccount(prisma);

    await expect(einvoiceSendService.send(strangerAccountId, issued.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it("does not leak another account's document: getTransmission returns NOT_FOUND", async () => {
    const ownerAccountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, ownerAccountId);
    const issued = await issueDocumentForPeppolClient(ownerAccountId);
    await einvoiceSendService.send(ownerAccountId, issued.id);

    const strangerAccountId = await createAccount(prisma);

    await expect(
      einvoiceSendService.getTransmission(strangerAccountId, issued.id),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
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

    const rejectingService = buildService(
      new ScriptedPeppolTransport([
        { providerMessageId: '', status: 'rejected', errorText: 'peer unreachable' },
      ]),
      [],
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

    const rejectingService = buildService(
      new ScriptedPeppolTransport([
        { providerMessageId: '', status: 'rejected', errorText: 'peer unreachable' },
      ]),
      [],
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

  describe('routing by issuer country', () => {
    it('routes a RO-issued document to the transport registered for RO, not Peppol', async () => {
      const accountId = await createAccount(prisma);
      await createCompleteIssuerProfile(prisma, accountId, undefined, {
        country: 'RO',
        street: 'Bulevardul Unirii 1',
        postcode: '030167',
        countyRegion: 'B',
      });
      const client = await prisma.client.create({
        data: { accountId, companyName: 'Client SRL', vatNumber: 'RO18547290', countyRegion: 'B' },
      });
      const draft = await documentsService.saveDraft(
        accountId,
        null,
        draftRequest({ clientId: client.id }),
      );
      const issued = await issuanceService.issue(accountId, draft.id, {});

      const roTransport = fakeEinvoiceTransport({ providerName: 'anaf', country: 'RO' });
      const service = buildService(new MockPeppolTransport(), [roTransport]);

      const transmission = await service.send(accountId, issued.id);

      expect(transmission.provider).toBe('anaf');
      expect(transmission.status).toBe('SENT');
      expect(roTransport.captured?.documentId).toBe(issued.id);
      expect(roTransport.captured?.recipient.vatNumber).toBe('RO18547290');
      expect(roTransport.captured?.recipient.countyRegion).toBe('B');
    });

    it('falls back to Peppol for a BG-issued document when no country transport is registered', async () => {
      const accountId = await createAccount(prisma);
      await createCompleteIssuerProfile(prisma, accountId, undefined, { country: 'BG' });
      const itTransport = fakeEinvoiceTransport({ providerName: 'sdi', country: 'IT' });
      const issued = await issueDocumentForPeppolClient(accountId);

      const service = buildService(new MockPeppolTransport(), [itTransport]);

      const transmission = await service.send(accountId, issued.id);

      expect(transmission.provider).toBe('mock');
      expect(itTransport.captured).toBeUndefined();
    });

    it('throws EINVOICE_TRANSPORT_NOT_CONFIGURED and writes no row when the registered transport is not configured', async () => {
      const accountId = await createAccount(prisma);
      await createCompleteIssuerProfile(prisma, accountId, undefined, {
        country: 'IT',
        street: 'Via Roma 1',
        postcode: '00100',
        countyRegion: 'RM',
      });
      const client = await prisma.client.create({
        data: { accountId, companyName: 'Cliente SRL' },
      });
      const draft = await documentsService.saveDraft(
        accountId,
        null,
        draftRequest({ clientId: client.id }),
      );
      const issued = await issuanceService.issue(accountId, draft.id, {});

      const unconfiguredTransport = fakeEinvoiceTransport({
        providerName: 'sdi',
        country: 'IT',
        configured: false,
      });
      const service = buildService(new MockPeppolTransport(), [unconfiguredTransport]);

      await expect(service.send(accountId, issued.id)).rejects.toMatchObject({
        code: 'EINVOICE_TRANSPORT_NOT_CONFIGURED',
      });

      const stored = await prisma.einvoiceTransmission.findUnique({
        where: { documentId: issued.id },
      });
      expect(stored).toBeNull();
    });
  });

  describe('refresh', () => {
    it('polls checkStatus on the registered transport and updates the row', async () => {
      const accountId = await createAccount(prisma);
      await createCompleteIssuerProfile(prisma, accountId, undefined, {
        country: 'RO',
        street: 'Bulevardul Unirii 1',
        postcode: '030167',
        countyRegion: 'B',
      });
      const client = await prisma.client.create({
        data: { accountId, companyName: 'Client SRL' },
      });
      const draft = await documentsService.saveDraft(
        accountId,
        null,
        draftRequest({ clientId: client.id }),
      );
      const issued = await issuanceService.issue(accountId, draft.id, {});

      const roTransport = fakeEinvoiceTransport({
        providerName: 'anaf',
        country: 'RO',
        statusResults: [{ status: 'accepted', receipt: 'receipt-xml' }],
      });
      const service = buildService(new MockPeppolTransport(), [roTransport]);

      await service.send(accountId, issued.id);
      const refreshed = await service.refresh(accountId, issued.id);

      expect(refreshed.status).toBe('ACCEPTED');
      expect(refreshed.receipt).toBe('receipt-xml');

      const stored = await prisma.einvoiceTransmission.findUnique({
        where: { documentId: issued.id },
      });
      expect(stored?.status).toBe('ACCEPTED');
    });

    it('returns 409 refreshing a Peppol-routed transmission, which has no status polling', async () => {
      const accountId = await createAccount(prisma);
      await createCompleteIssuerProfile(prisma, accountId, undefined, { country: 'BG' });
      const issued = await issueDocumentForPeppolClient(accountId);

      await einvoiceSendService.send(accountId, issued.id);

      await expect(einvoiceSendService.refresh(accountId, issued.id)).rejects.toMatchObject({
        code: 'EINVOICE_STATUS_POLLING_NOT_SUPPORTED',
        status: 409,
      });
    });

    it('returns 409 refreshing a registered transport that does not support status polling', async () => {
      const accountId = await createAccount(prisma);
      await createCompleteIssuerProfile(prisma, accountId, undefined, {
        country: 'RO',
        street: 'Bulevardul Unirii 1',
        postcode: '030167',
        countyRegion: 'B',
      });
      const client = await prisma.client.create({
        data: { accountId, companyName: 'Client SRL' },
      });
      const draft = await documentsService.saveDraft(
        accountId,
        null,
        draftRequest({ clientId: client.id }),
      );
      const issued = await issuanceService.issue(accountId, draft.id, {});

      const roTransport = fakeEinvoiceTransport({ providerName: 'anaf', country: 'RO' });
      const service = buildService(new MockPeppolTransport(), [roTransport]);

      await service.send(accountId, issued.id);

      await expect(service.refresh(accountId, issued.id)).rejects.toMatchObject({
        code: 'EINVOICE_STATUS_POLLING_NOT_SUPPORTED',
        status: 409,
      });
    });
  });
});
