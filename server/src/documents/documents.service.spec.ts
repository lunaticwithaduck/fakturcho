import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { NumberingService } from '../numbering/numbering.service';
import type { TestDatabase } from '../testing/test-database';
import { startTestDatabase } from '../testing/test-database';
import { DocumentIssuanceService } from './document-issuance.service';
import { DocumentsService } from './documents.service';
import { createAccount, createCompleteIssuerProfile, draftRequest } from './test-support';

describe('DocumentsService', () => {
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

  it('invariant 7: mutating a non-draft document is rejected with DOCUMENT_IMMUTABLE (409)', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const draft = await documentsService.saveDraft(accountId, null, draftRequest());
    const issued = await issuanceService.issue(accountId, draft.id, {});

    await expect(
      documentsService.saveDraft(accountId, issued.id, draftRequest({ notes: 'changed' })),
    ).rejects.toMatchObject({ code: 'DOCUMENT_IMMUTABLE' });

    try {
      await documentsService.saveDraft(accountId, issued.id, draftRequest({ notes: 'changed' }));
      throw new Error('expected DomainError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).status).toBe(409);
    }
  });

  it('invariant 8: credit_note and debit_note without originalDocumentId are rejected at creation', async () => {
    const accountId = await createAccount(prisma);

    await expect(
      documentsService.saveDraft(accountId, null, draftRequest({ documentType: 'credit_note' })),
    ).rejects.toMatchObject({ code: 'ORIGINAL_DOCUMENT_REQUIRED' });

    await expect(
      documentsService.saveDraft(accountId, null, draftRequest({ documentType: 'debit_note' })),
    ).rejects.toMatchObject({ code: 'ORIGINAL_DOCUMENT_REQUIRED' });

    const original = await documentsService.saveDraft(accountId, null, draftRequest());
    const creditNote = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'credit_note', originalDocumentId: original.id }),
    );
    expect(creditNote.originalDocumentId).toBe(original.id);
  });

  it('invariant 19: issuing with a missing or incomplete issuer profile is rejected; the draft save itself succeeds', async () => {
    const accountId = await createAccount(prisma);

    const draft = await documentsService.saveDraft(accountId, null, draftRequest());
    expect(draft.status).toBe('draft');

    await expect(issuanceService.issue(accountId, draft.id, {})).rejects.toMatchObject({
      code: 'ISSUER_PROFILE_INCOMPLETE',
    });

    const stillDraft = await documentsService.get(accountId, draft.id);
    expect(stillDraft.status).toBe('draft');
    expect(stillDraft.number).toBeNull();

    await prisma.issuerProfile.create({
      data: { accountId, companyName: 'Непълен ЕООД' },
    });

    await expect(issuanceService.issue(accountId, draft.id, {})).rejects.toMatchObject({
      code: 'ISSUER_PROFILE_INCOMPLETE',
    });
  });
});
