import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { NumberingService } from '../numbering/numbering.service';
import type { TestDatabase } from '../testing/test-database';
import { startTestDatabase } from '../testing/test-database';
import { DocumentIssuanceService } from './document-issuance.service';
import { DocumentsService } from './documents.service';
import {
  createAccount,
  createCompleteIssuerProfile,
  createTestClient,
  draftRequest,
} from './test-support';

describe('DocumentIssuanceService', () => {
  let db: TestDatabase;
  let prisma: PrismaClient;
  let documentsService: DocumentsService;
  let issuanceService: DocumentIssuanceService;

  beforeAll(async () => {
    db = await startTestDatabase();
    prisma = db.prisma;
    const prismaService = prisma as unknown as PrismaService;
    documentsService = new DocumentsService(prismaService);
    issuanceService = new DocumentIssuanceService(
      prismaService,
      new NumberingService(prismaService),
    );
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('invariant 1: issuing 100 documents across two types produces two gapless sequences, unaffected by 50 abandoned drafts', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);

    const invoiceNumbers: number[] = [];
    const proformaNumbers: number[] = [];

    for (let i = 0; i < 50; i += 1) {
      await documentsService.saveDraft(accountId, null, draftRequest({ documentType: 'quote' }));

      const invoiceDraft = await documentsService.saveDraft(
        accountId,
        null,
        draftRequest({ documentType: 'invoice' }),
      );
      const issuedInvoice = await issuanceService.issue(accountId, invoiceDraft.id, {});
      invoiceNumbers.push(issuedInvoice.number as number);

      const proformaDraft = await documentsService.saveDraft(
        accountId,
        null,
        draftRequest({ documentType: 'proforma' }),
      );
      const issuedProforma = await issuanceService.issue(accountId, proformaDraft.id, {});
      proformaNumbers.push(issuedProforma.number as number);
    }

    expect(invoiceNumbers).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
    expect(proformaNumbers).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
  }, 120_000);

  it('invariant 2: concurrent issuances through the full issue() path stay gapless and unique', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);

    const drafts = await Promise.all(
      Array.from({ length: 15 }, () => documentsService.saveDraft(accountId, null, draftRequest())),
    );

    const issued = await Promise.all(
      drafts.map((draft) => issuanceService.issue(accountId, draft.id, {})),
    );
    const numbers = issued.map((doc) => doc.number as number).sort((a, b) => a - b);

    expect(new Set(numbers).size).toBe(15);
    expect(numbers).toEqual(Array.from({ length: 15 }, (_, index) => index + 1));
  });

  it('invariant 4: a cancelled document number is never reissued', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);

    const draft1 = await documentsService.saveDraft(accountId, null, draftRequest());
    const issued1 = await issuanceService.issue(accountId, draft1.id, {});
    await issuanceService.cancel(accountId, issued1.id);

    const draft2 = await documentsService.saveDraft(accountId, null, draftRequest());
    const issued2 = await issuanceService.issue(accountId, draft2.id, {});

    expect(issued2.number).toBe((issued1.number as number) + 1);
  });

  it('invariants 5 & 6: party snapshots are frozen at issuance and a blank mol stays blank', async () => {
    const accountId = await createAccount(prisma);
    const issuerProfile = await createCompleteIssuerProfile(prisma, accountId, null);
    const client = await createTestClient(prisma, accountId);

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});

    expect(issued.issuer.mol).toBeNull();
    expect(issued.recipient.companyName).toBe('Клиент ООД');

    await prisma.issuerProfile.update({
      where: { id: issuerProfile.id },
      data: { mol: 'Петър Петров', companyName: 'Друго Име ЕООД' },
    });
    await prisma.client.update({
      where: { id: client.id },
      data: { companyName: 'Преименуван Клиент' },
    });

    const refetched = await documentsService.get(accountId, issued.id);

    expect(refetched.issuer).toEqual(issued.issuer);
    expect(refetched.recipient).toEqual(issued.recipient);
    expect(refetched.issuer.mol).toBeNull();
    expect(refetched.issuer.companyName).toBe('Тест ЕООД');
  });
});
