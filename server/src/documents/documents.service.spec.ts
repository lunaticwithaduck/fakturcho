import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreditsService } from '../billing/credits.service';
import { DomainError } from '../common/domain-error';
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
      new CreditsService(prismaService),
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

  it('BG-default draft behavior is unchanged: no clientId, no language, no per-line VAT fields', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);

    const draft = await documentsService.saveDraft(accountId, null, draftRequest());

    expect(draft.documentLanguage).toBeNull();
    expect(draft.buyerReference).toBeNull();
    expect(draft.paymentMeansCode).toBeNull();
    expect(draft.paymentTermsNote).toBeNull();
    expect(draft.deliveryDate).toBeNull();
    expect(draft.lineItems).toHaveLength(1);
    expect(draft.lineItems[0]).toMatchObject({
      vatRateBp: 0,
      vatCategory: 'O',
      unitCode: null,
    });
  });

  it('BG-only document totals are byte-identical to the flat computation (non-negotiable)', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { vatRegistered: true });

    const draft = await documentsService.saveDraft(accountId, null, draftRequest());

    expect(draft.subtotal).toBe(1000);
    expect(draft.discountTotal).toBe(0);
    expect(draft.vatAmount).toBe(200);
    expect(draft.amount).toBe(1200);
  });

  it('document totals reflect per-line VAT categories for a mixed-rate document', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'BG',
      vatRegistered: true,
    });
    const client = await createTestClient(prisma, accountId, {
      country: 'DE',
      vatNumber: 'DE123456789',
    });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        clientId: client.id,
        lineItems: [
          { name: 'Консултация', quantity: '1', unitPrice: 100000, sortOrder: 0 },
          {
            name: 'Хостинг',
            quantity: '1',
            unitPrice: 50000,
            sortOrder: 1,
            vatCategory: 'S',
            vatRateBp: 2000,
          },
        ],
      }),
    );

    const reverseChargedLine = draft.lineItems.find((line) => line.sortOrder === 0);
    const standardLine = draft.lineItems.find((line) => line.sortOrder === 1);
    expect(reverseChargedLine).toMatchObject({ vatCategory: 'AE', vatRateBp: 0 });
    expect(standardLine).toMatchObject({ vatCategory: 'S', vatRateBp: 2000 });

    expect(draft.subtotal).toBe(150000);
    expect(draft.discountTotal).toBe(0);
    expect(draft.vatAmount).toBe(10000);
    expect(draft.amount).toBe(160000);
  });

  it('a vatExemptionGround needed for the reverse-charged line does not zero out a mixed document', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'DE',
      vatRegistered: true,
    });

    const deReverseChargeGround = 'Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG';
    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        vatExemptionGround: deReverseChargeGround,
        lineItems: [
          {
            name: 'Консултация',
            quantity: '1',
            unitPrice: 50000,
            sortOrder: 0,
            vatCategory: 'AE',
            vatRateBp: 0,
          },
          {
            name: 'Хостинг',
            quantity: '1',
            unitPrice: 50000,
            sortOrder: 1,
            vatCategory: 'S',
            vatRateBp: 2000,
          },
        ],
      }),
    );

    expect(draft.vatExemptionGround).toBe(deReverseChargeGround);
    expect(draft.vatRateBp).toBeGreaterThan(0);
    expect(draft.subtotal).toBe(100000);
    expect(draft.vatAmount).toBe(10000);
    expect(draft.amount).toBe(110000);
  });

  it('buyerReference, paymentMeansCode, paymentTermsNote and deliveryDate round-trip through a save', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        buyerReference: 'PO-1234',
        paymentMeansCode: '30',
        paymentTermsNote: 'Net 30',
        deliveryDate: '2026-09-15',
      }),
    );

    expect(draft.buyerReference).toBe('PO-1234');
    expect(draft.paymentMeansCode).toBe('30');
    expect(draft.paymentTermsNote).toBe('Net 30');
    expect(draft.deliveryDate).toBe('2026-09-15');

    const refetched = await documentsService.get(accountId, draft.id);
    expect(refetched.buyerReference).toBe('PO-1234');
    expect(refetched.paymentMeansCode).toBe('30');
    expect(refetched.paymentTermsNote).toBe('Net 30');
    expect(refetched.deliveryDate).toBe('2026-09-15');
  });

  it('paymentTermsDays round-trips through a save, independent of paymentTermsNote', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ paymentTermsDays: 14 }),
    );

    expect(draft.paymentTermsDays).toBe(14);
    expect(draft.paymentTermsNote).toBeNull();

    const refetched = await documentsService.get(accountId, draft.id);
    expect(refetched.paymentTermsDays).toBe(14);
  });

  it('per-line vatRateBp, vatCategory and unitCode round-trip through a save', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        lineItems: [
          {
            name: 'Консултация',
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

    expect(draft.lineItems[0]).toMatchObject({
      vatRateBp: 900,
      vatCategory: 'Z',
      unitCode: 'HUR',
    });

    const refetched = await documentsService.get(accountId, draft.id);
    expect(refetched.lineItems[0]).toMatchObject({
      vatRateBp: 900,
      vatCategory: 'Z',
      unitCode: 'HUR',
    });
  });

  it('splitPaymentAnnex15 (PL art. 106e ust. 1 pkt 18a) round-trips through a save, defaulting to false', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { country: 'PL' });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        lineItems: [
          { name: 'Towar', quantity: '1', unitPrice: 1000, sortOrder: 0 },
          {
            name: 'Towar z zał. 15',
            quantity: '1',
            unitPrice: 2000,
            sortOrder: 1,
            splitPaymentAnnex15: true,
          },
        ],
      }),
    );

    expect(draft.lineItems[0]).toMatchObject({ splitPaymentAnnex15: false });
    expect(draft.lineItems[1]).toMatchObject({ splitPaymentAnnex15: true });

    const refetched = await documentsService.get(accountId, draft.id);
    expect(refetched.lineItems[0]).toMatchObject({ splitPaymentAnnex15: false });
    expect(refetched.lineItems[1]).toMatchObject({ splitPaymentAnnex15: true });
  });

  it('documentLanguage is resolved from the client at draft save time', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);
    const client = await createTestClient(prisma, accountId, { documentLanguage: 'en' });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );
    expect(draft.documentLanguage).toBe('en');

    const clientWithoutLanguage = await createTestClient(prisma, accountId);
    const draftWithoutLanguage = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: clientWithoutLanguage.id }),
    );
    expect(draftWithoutLanguage.documentLanguage).toBeNull();
  });

  it('reverse-charge: an unset line vatCategory defaults to AE at 0 rate for a cross-border EU client with a valid VAT number', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'BG',
      vatRegistered: true,
    });
    const client = await createTestClient(prisma, accountId, {
      country: 'DE',
      vatNumber: 'DE123456789',
    });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );

    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'AE', vatRateBp: 0 });
  });

  it('reverse-charge: an unset line vatCategory does not become AE when the issuer is not VAT-registered', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { country: 'BG' });
    const client = await createTestClient(prisma, accountId, {
      country: 'DE',
      vatNumber: 'DE123456789',
    });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );

    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'O', vatRateBp: 0 });
    expect(draft.vatAmount).toBe(0);
  });

  it('PL art. 113 exempt issuer: an unset line vatCategory resolves to E (zw), not O (np.)', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { country: 'PL' });

    const draft = await documentsService.saveDraft(accountId, null, draftRequest());

    expect(draft.vatExemptionGround).toContain('art. 113');
    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'E', vatRateBp: 0 });
    expect(draft.vatAmount).toBe(0);
  });

  it('other countries keep O for a non-VAT-registered issuer, unaffected by the PL exemption fix', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { country: 'DE' });

    const draft = await documentsService.saveDraft(accountId, null, draftRequest());

    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'O', vatRateBp: 0 });
  });

  it('reverse-charge: a cross-border EU client with no VAT number stays S at the issuer standard rate', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'BG',
      vatRegistered: true,
    });
    const client = await createTestClient(prisma, accountId, { country: 'DE' });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );

    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'S', vatRateBp: 2000 });
  });

  it('reverse-charge: a cross-border EU client with a badly formatted VAT number stays S at the issuer standard rate', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'NL',
      vatRegistered: true,
    });
    const client = await createTestClient(prisma, accountId, {
      country: 'BG',
      vatNumber: 'BG123',
    });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );

    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'S', vatRateBp: 2100 });
  });

  it('§ 10 Abs. 4 UStG 1994: an AT issuer with the Jungholz/Mittelberg flag defaults a new line to 19% for a client inside the zone', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'AT',
      vatRegistered: true,
      identifiers: { jungholzMittelbergRate: 'true' },
    });
    const client = await createTestClient(prisma, accountId, { country: 'AT', postcode: '6991' });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );

    expect(draft.lineItems[0]).toMatchObject({ vatRateBp: 1900 });
  });

  it('§ 10 Abs. 4 UStG 1994: the same flag defaults to 20% for a domestic client outside Jungholz/Mittelberg (Betriebsstätte carve-out)', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'AT',
      vatRegistered: true,
      identifiers: { jungholzMittelbergRate: 'true' },
    });
    const client = await createTestClient(prisma, accountId, { country: 'AT', postcode: '1060' });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );

    expect(draft.lineItems[0]).toMatchObject({ vatRateBp: 2000 });
  });

  it('§ 10 Abs. 4 UStG 1994: the flag still defaults to 19% with no client selected or a foreign client', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'AT',
      vatRegistered: true,
      identifiers: { jungholzMittelbergRate: 'true' },
    });

    const noClientDraft = await documentsService.saveDraft(accountId, null, draftRequest());
    expect(noClientDraft.lineItems[0]).toMatchObject({ vatRateBp: 1900 });

    const foreignClient = await createTestClient(prisma, accountId, { country: 'DE' });
    const foreignDraft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: foreignClient.id }),
    );
    expect(foreignDraft.lineItems[0]).toMatchObject({ vatRateBp: 1900 });
  });

  it('reverse-charge: an explicit vatCategory is always honored, even cross-border', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { country: 'BG' });
    const client = await createTestClient(prisma, accountId, { country: 'DE' });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        clientId: client.id,
        lineItems: [
          {
            name: 'Услуга',
            quantity: '1',
            unitPrice: 1000,
            sortOrder: 0,
            vatCategory: 'S',
            vatRateBp: 2000,
          },
        ],
      }),
    );

    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'S', vatRateBp: 2000 });
  });

  it('reverse-charge does not apply for a domestic BG-BG pair, VAT number or not', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, {
      country: 'BG',
      vatRegistered: true,
    });
    const client = await createTestClient(prisma, accountId, {
      country: 'BG',
      vatNumber: 'BG123456789',
    });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ clientId: client.id }),
    );

    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'S', vatRateBp: 2000 });
  });

  it('delivery_note is not a tax document: no VAT charged and no exemption ground, regardless of issuer VAT registration', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { vatRegistered: true });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'delivery_note' }),
    );

    expect(draft.vatAmount).toBe(0);
    expect(draft.vatExemptionGround).toBeNull();
    expect(draft.lineItems[0]).toMatchObject({ vatCategory: 'O', vatRateBp: 0 });
  });

  it('delivery_note may optionally reference an invoice, unlike credit/debit note it is not required', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId);

    const withoutReference = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'delivery_note' }),
    );
    expect(withoutReference.originalDocumentId).toBeNull();

    const invoice = await documentsService.saveDraft(accountId, null, draftRequest());
    const withReference = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'delivery_note', originalDocumentId: invoice.id }),
    );
    expect(withReference.originalDocumentId).toBe(invoice.id);
  });

  it('delivery_note transport fields round-trip through a save', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { country: 'IT' });

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        documentType: 'delivery_note',
        deliveryDate: '2026-09-15',
        transportReason: 'Vendita',
        transportedAt: '2026-09-15T09:30',
        carrierName: 'Bartolini SpA',
        transportNote: '3 colli, 12 kg',
      }),
    );

    expect(draft.deliveryDate).toBe('2026-09-15');
    expect(draft.transportReason).toBe('Vendita');
    // 09:30 Rome time (CEST, UTC+2 in September) is stored as the 07:30 UTC instant.
    expect(draft.transportedAt).toBe('2026-09-15T07:30:00.000Z');
    expect(draft.carrierName).toBe('Bartolini SpA');
    expect(draft.transportNote).toBe('3 colli, 12 kg');

    const refetched = await documentsService.get(accountId, draft.id);
    expect(refetched.transportReason).toBe('Vendita');
    expect(refetched.transportedAt).toBe('2026-09-15T07:30:00.000Z');
  });

  it('correctionReason round-trips through a draft save without being required to save', async () => {
    const accountId = await createAccount(prisma);
    await createCompleteIssuerProfile(prisma, accountId, null, { country: 'BG' });

    const original = await documentsService.saveDraft(accountId, null, draftRequest());
    const withoutReason = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({ documentType: 'credit_note', originalDocumentId: original.id }),
    );
    expect(withoutReason.correctionReason).toBeNull();

    const draft = await documentsService.saveDraft(
      accountId,
      null,
      draftRequest({
        documentType: 'credit_note',
        originalDocumentId: original.id,
        correctionReason: 'Върната стока',
      }),
    );
    expect(draft.correctionReason).toBe('Върната стока');

    const refetched = await documentsService.get(accountId, draft.id);
    expect(refetched.correctionReason).toBe('Върната стока');

    const cleared = await documentsService.saveDraft(
      accountId,
      draft.id,
      draftRequest({
        documentType: 'credit_note',
        originalDocumentId: original.id,
        correctionReason: null,
      }),
    );
    expect(cleared.correctionReason).toBeNull();
  });
});
