import type { DocumentStatus, DocumentType, Prisma, PrismaClient } from '@prisma/client';

export interface SeedDocumentOptions {
  accountId: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  number?: number | null;
  overrides?: Partial<Prisma.DocumentUncheckedCreateInput>;
}

export async function seedDocument(
  prisma: PrismaClient,
  options: SeedDocumentOptions,
): Promise<Prisma.DocumentGetPayload<{ include: { lineItems: true } }>> {
  const { accountId, documentType = 'INVOICE', status = 'SENT', number = 16 } = options;
  return prisma.document.create({
    data: {
      accountId,
      documentType,
      status,
      number,
      issuedAt: new Date('2026-08-02'),
      taxEventAt: new Date('2026-08-02'),
      validUntil: new Date('2026-09-02'),
      subtotal: 458333,
      discountTotal: 0,
      amount: 550000,
      vatIncluded: false,
      vatRateBp: 2000,
      vatAmount: 91667,
      vatExemptionGround: null,
      currency: 'EUR',
      preparedBy: 'Иван Иванов',
      templateId: 'classic',
      issuerCompanyName: '"Тестова Компания" ЕООД',
      issuerEik: '123456789',
      issuerMol: 'Мария Петрова',
      issuerAddressLine: 'ул. Витоша 15',
      issuerCity: 'гр. София',
      issuerPhone: '+359 888 123 456',
      issuerVatRegistered: true,
      issuerVatNumber: 'BG123456789',
      issuerBankName: 'Банка ДСК АД',
      issuerIban: 'BG80BNBG96611020345678',
      issuerBic: 'BNBGBGSD',
      recipientCompanyName: '"Клиентска Фирма" ООД',
      recipientEik: '987654321',
      recipientAddress: 'гр. Пловдив, бул. Свобода 5',
      recipientMol: 'Петър Георгиев',
      lineItems: {
        create: [
          {
            name: 'Консултантска услуга',
            quantity: '220',
            unitPrice: 2500,
            lineTotal: 550000,
            sortOrder: 0,
          },
        ],
      },
      ...options.overrides,
    },
    include: { lineItems: true },
  });
}
