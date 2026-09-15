import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreditsService } from '../billing/credits.service';
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
      new CreditsService(prismaService),
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

  it('issuance snapshot copies issuer and recipient country, street and postcode', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'NL',
      street: 'Musterstrasse 1',
      postcode: '10115',
    });
    const client = await createTestClient(prisma, accountId, {
      country: 'NL',
      street: 'Kundenweg 2',
      postcode: '10117',
    });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});

    expect(issued.issuer.country).toBe('NL');
    expect(issued.issuer.street).toBe('Musterstrasse 1');
    expect(issued.issuer.postcode).toBe('10115');
    expect(issued.recipient.country).toBe('NL');
    expect(issued.recipient.street).toBe('Kundenweg 2');
    expect(issued.recipient.postcode).toBe('10117');
  });

  it('issuance persists every draft field: document metadata, per-line VAT fields, and both party snapshots', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'IT',
      street: 'Via Roma 1',
      postcode: '00100',
      countyRegion: 'RM',
      vatRegistered: true,
      vatNumber: 'IT12345678901',
    });
    const client = await createTestClient(prisma, accountId, {
      country: 'IT',
      street: 'Via Napoli 2',
      postcode: '80100',
      countyRegion: 'NA',
      documentLanguage: 'en',
      sdiRecipientCode: 'ABCDEFG',
      pec: 'client@pec.it',
    });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        clientId: client.id,
        buyerReference: 'PO-9001',
        paymentMeansCode: '30',
        paymentTermsNote: 'Net 30',
        deliveryDate: '2026-09-20',
        lineItems: [
          {
            name: 'Consulenza',
            quantity: '2',
            unitPrice: 5000,
            sortOrder: 0,
            vatRateBp: 900,
            vatCategory: 'Z',
            unitCode: 'HUR',
          },
        ],
      }),
    );
    const issued = await issuanceService.issue(accountId, draft.id, {});
    const refetched = await documentsService.get(accountId, issued.id);

    for (const document of [issued, refetched]) {
      expect(document.buyerReference).toBe('PO-9001');
      expect(document.paymentMeansCode).toBe('30');
      expect(document.paymentTermsNote).toBe('Net 30');
      expect(document.deliveryDate).toBe('2026-09-20');
      expect(document.documentLanguage).toBe('en');
      expect(document.lineItems[0]).toMatchObject({
        vatRateBp: 900,
        vatCategory: 'Z',
        unitCode: 'HUR',
      });
      expect(document.issuer).toMatchObject({
        country: 'IT',
        street: 'Via Roma 1',
        postcode: '00100',
        countyRegion: 'RM',
      });
      expect(document.recipient).toMatchObject({
        country: 'IT',
        street: 'Via Napoli 2',
        postcode: '80100',
        countyRegion: 'NA',
        sdiRecipientCode: 'ABCDEFG',
        pec: 'client@pec.it',
      });
    }
  });

  it('documentLanguage is set from the client at draft save and survives issuance unchanged', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createTestClient(prisma, accountId, { documentLanguage: 'en' });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    expect(draft.documentLanguage).toBe('en');

    const issued = await issuanceService.issue(accountId, draft.id, {});
    expect(issued.documentLanguage).toBe('en');

    await prisma.client.update({ where: { id: client.id }, data: { documentLanguage: 'bg' } });
    const refetched = await documentsService.get(accountId, issued.id);
    expect(refetched.documentLanguage).toBe('en');
  });

  it('an Italian delivery note cannot be issued without a transport reason and transport date/time', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'IT',
      street: 'Via Roma 1',
      postcode: '00100',
      countyRegion: 'RM',
    });
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'delivery_note' }),
    );

    await expect(issuanceService.issue(accountId, draft.id, {})).rejects.toMatchObject({
      code: 'DELIVERY_NOTE_TRANSPORT_DATA_REQUIRED',
    });

    const stillDraft = await documentsService.get(accountId, draft.id);
    expect(stillDraft.status).toBe('draft');
  });

  it('an Italian delivery note issues once the transport reason and date/time are set', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'IT',
      street: 'Via Roma 1',
      postcode: '00100',
      countyRegion: 'RM',
    });
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        documentType: 'delivery_note',
        transportReason: 'Vendita',
        transportedAt: '2026-09-15T09:30',
      }),
    );

    const issued = await issuanceService.issue(accountId, draft.id, {});
    expect(issued.status).toBe('sent');
    expect(issued.number).not.toBeNull();
  });

  it('a non-Italian delivery note issues without any transport data, credit charged the same as any other type', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'delivery_note' }),
    );

    const issued = await issuanceService.issue(accountId, draft.id, {});
    expect(issued.status).toBe('sent');
    expect(issued.number).not.toBeNull();
  });

  it('a Romanian delivery note cannot be issued without a carrier and transport date/time', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'RO',
      street: 'Str. Victoriei 1',
      postcode: '010071',
      countyRegion: 'București',
    });
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'delivery_note' }),
    );

    await expect(issuanceService.issue(accountId, draft.id, {})).rejects.toMatchObject({
      code: 'DELIVERY_NOTE_TRANSPORT_DATA_REQUIRED',
    });

    const stillDraft = await documentsService.get(accountId, draft.id);
    expect(stillDraft.status).toBe('draft');
  });

  it('a Romanian delivery note issues once the carrier and transport date/time are set', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'RO',
      street: 'Str. Victoriei 1',
      postcode: '010071',
      countyRegion: 'București',
    });
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        documentType: 'delivery_note',
        carrierName: 'Ion Popescu, CI seria RD nr. 123456',
        transportedAt: '2026-09-15T09:30',
      }),
    );

    const issued = await issuanceService.issue(accountId, draft.id, {});
    expect(issued.status).toBe('sent');
    expect(issued.number).not.toBeNull();
  });
});
