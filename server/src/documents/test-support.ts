import type { SaveDraftRequest } from '@fakturcho/shared-types';
import type { PrismaClient } from '@prisma/client';

export async function createAccount(prisma: PrismaClient): Promise<string> {
  const account = await prisma.account.create({ data: { creditBalanceCents: 1_000_000 } });
  return account.id;
}

export async function createCompleteIssuerProfile(
  prisma: PrismaClient,
  accountId: string,
  mol: string | null = 'Иван Иванов',
  overrides: Partial<{
    country: string;
    street: string | null;
    postcode: string | null;
    countyRegion: string | null;
    vatRegistered: boolean;
    vatNumber: string | null;
    vatOnCashBasis: boolean;
    vatOnDebits: boolean;
  }> = {},
) {
  return prisma.issuerProfile.create({
    data: {
      accountId,
      companyName: 'Тест ЕООД',
      eik: '123456789',
      mol,
      addressLine: 'ул. Тестова 1',
      city: 'София',
      vatRegistered: false,
      ...overrides,
    },
  });
}

export async function createTestClient(
  prisma: PrismaClient,
  accountId: string,
  overrides: Partial<{
    country: string;
    street: string | null;
    postcode: string | null;
    countyRegion: string | null;
    documentLanguage: string | null;
    vatNumber: string | null;
    sdiRecipientCode: string | null;
    pec: string | null;
  }> = {},
) {
  return prisma.client.create({ data: { accountId, companyName: 'Клиент ООД', ...overrides } });
}

export function draftRequest(overrides: Partial<SaveDraftRequest> = {}): SaveDraftRequest {
  return {
    documentType: 'invoice',
    lineItems: [{ name: 'Услуга', quantity: '1', unitPrice: 1000, sortOrder: 0 }],
    ...overrides,
  };
}
