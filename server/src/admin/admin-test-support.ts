import type { PrismaClient } from '@prisma/client';
import { CreditsService } from '../billing/credits.service';
import { DocumentIssuanceService } from '../documents/document-issuance.service';
import { DocumentsService } from '../documents/documents.service';
import {
  createAccount,
  createCompleteIssuerProfile,
  createTestClient,
  draftRequest,
} from '../documents/test-support';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { NumberingService } from '../numbering/numbering.service';

export interface AdminSeed {
  accountAId: string;
  accountBId: string;
}

export async function seedAdminFixtures(prisma: PrismaClient): Promise<AdminSeed> {
  const prismaService = prisma as unknown as PrismaService;
  const documentsService = new DocumentsService(prismaService);
  const issuanceService = new DocumentIssuanceService(
    prismaService,
    new NumberingService(prismaService),
    new CreditsService(prismaService),
  );

  const accountAId = await createAccount(prisma);
  await createCompleteIssuerProfile(prisma, accountAId);
  await prisma.issuerProfile.update({
    where: { accountId: accountAId },
    data: {
      companyName: 'Алфа ЕООД',
      city: 'Пловдив',
      iban: 'BG00ALFA0000000000',
      bic: 'ALFABGSF',
    },
  });
  await prisma.user.create({
    data: {
      id: 'admin-test-user-a',
      name: 'User A',
      email: 'user-a@alfa.bg',
      accountId: accountAId,
    },
  });
  await prisma.subscription.create({
    data: {
      accountId: accountAId,
      status: 'ACTIVE',
      planId: 'business',
      currentPeriodEnd: new Date('2099-01-01'),
    },
  });
  const clientA = await createTestClient(prisma, accountAId);

  const accountBId = await createAccount(prisma);
  await createCompleteIssuerProfile(prisma, accountBId);
  await prisma.issuerProfile.update({
    where: { accountId: accountBId },
    data: { companyName: 'Бета ООД', city: 'Варна' },
  });
  await prisma.user.create({
    data: {
      id: 'admin-test-user-b',
      name: 'User B',
      email: 'user-b@beta.bg',
      accountId: accountBId,
    },
  });

  const draftA1 = await documentsService.saveDraft(
    accountAId,
    null,
    draftRequest({
      clientId: clientA.id,
      lineItems: [{ name: 'Услуга A1', quantity: '1', unitPrice: 5000, sortOrder: 0 }],
    }),
  );
  const issuedA1 = await issuanceService.issue(accountAId, draftA1.id, {});
  await prisma.document.update({ where: { id: issuedA1.id }, data: { emailedAt: new Date() } });

  const draftA2 = await documentsService.saveDraft(
    accountAId,
    null,
    draftRequest({
      lineItems: [{ name: 'Услуга A2', quantity: '1', unitPrice: 7000, sortOrder: 0 }],
    }),
  );
  await issuanceService.issue(accountAId, draftA2.id, {});
  await documentsService.saveDraft(accountAId, null, draftRequest());

  const draftB1 = await documentsService.saveDraft(
    accountBId,
    null,
    draftRequest({
      lineItems: [{ name: 'Услуга B1', quantity: '1', unitPrice: 3000, sortOrder: 0 }],
    }),
  );
  await issuanceService.issue(accountBId, draftB1.id, {});
  await documentsService.saveDraft(accountBId, null, draftRequest());

  const now = new Date();
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15));
  await prisma.creditLedgerEntry.create({
    data: { accountId: accountAId, amountCents: 500, reason: 'SIGNUP_GRANT' },
  });
  await prisma.creditLedgerEntry.create({
    data: { accountId: accountAId, amountCents: -10, reason: 'ISSUANCE' },
  });
  await prisma.creditLedgerEntry.create({
    data: {
      accountId: accountAId,
      amountCents: 2000,
      reason: 'PURCHASE',
      revolutOrderId: 'admin-test-order-1',
    },
  });
  await prisma.creditLedgerEntry.create({
    data: {
      accountId: accountAId,
      amountCents: 3000,
      reason: 'PURCHASE',
      revolutOrderId: 'admin-test-order-2',
    },
  });
  await prisma.creditLedgerEntry.create({
    data: {
      accountId: accountBId,
      amountCents: 1500,
      reason: 'PURCHASE',
      revolutOrderId: 'admin-test-order-3',
      createdAt: lastMonth,
    },
  });

  return { accountAId, accountBId };
}
