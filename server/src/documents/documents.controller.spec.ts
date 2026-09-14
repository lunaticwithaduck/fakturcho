import type { ClientDto, DocumentDto, IssuerProfileDto } from '@fakturcho/shared-types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreditsService } from '../billing/credits.service';
import { ClientsController } from '../clients/clients.controller';
import { ClientsService } from '../clients/clients.service';
import type { DomainError } from '../common/domain-error';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { IssuerController } from '../issuer/issuer.controller';
import { IssuerService } from '../issuer/issuer.service';
import { NumberingService } from '../numbering/numbering.service';
import type { TestDatabase } from '../testing/test-database';
import { startTestDatabase } from '../testing/test-database';
import { DocumentIssuanceService } from './document-issuance.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController — HTTP body round-trip', () => {
  let db: TestDatabase;
  let issuerController: IssuerController;
  let clientsController: ClientsController;
  let documentsController: DocumentsController;

  beforeAll(async () => {
    db = await startTestDatabase();
    const prismaService = db.prisma as unknown as PrismaService;
    issuerController = new IssuerController(new IssuerService(prismaService));
    clientsController = new ClientsController(new ClientsService(prismaService));
    const documentsService = new DocumentsService(prismaService);
    const issuanceService = new DocumentIssuanceService(
      prismaService,
      new NumberingService(prismaService),
      new CreditsService(prismaService),
    );
    documentsController = new DocumentsController(documentsService, issuanceService);
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  it('every EU/UBL field submitted as a raw HTTP body survives create, issue and re-read', async () => {
    const account = await db.prisma.account.create({ data: { creditBalanceCents: 1_000_000 } });
    const accountId = account.id;

    const issuerBody: unknown = {
      companyName: 'Acme GmbH',
      eik: '123456789',
      addressLine: 'Musterstrasse 1',
      street: 'Musterstrasse 1',
      postcode: '10115',
      countyRegion: 'BE',
      city: 'Berlin',
      country: 'NL',
      vatRegistered: true,
      vatNumber: 'DE123456789',
      peppolEndpointId: '0088:1234567890123',
      peppolScheme: '0088',
    };
    const issuer: IssuerProfileDto = await issuerController.updateProfile(accountId, issuerBody);
    expect(issuer).toMatchObject({
      street: 'Musterstrasse 1',
      postcode: '10115',
      countyRegion: 'BE',
      country: 'NL',
      peppolEndpointId: '0088:1234567890123',
      peppolScheme: '0088',
    });

    const clientBody: unknown = {
      companyName: 'Cliente SRL',
      street: 'Via Napoli 2',
      postcode: '80100',
      countyRegion: 'NA',
      country: 'IT',
      documentLanguage: 'en',
      vatNumber: 'IT12345678901',
      sdiRecipientCode: 'ABCDEFG',
      pec: 'client@pec.it',
    };
    const client: ClientDto = await clientsController.create(accountId, clientBody);
    expect(client).toMatchObject({
      street: 'Via Napoli 2',
      postcode: '80100',
      countyRegion: 'NA',
      country: 'IT',
      documentLanguage: 'en',
      sdiRecipientCode: 'ABCDEFG',
      pec: 'client@pec.it',
    });

    const draftBody: unknown = {
      documentType: 'invoice',
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
    };
    const draft: DocumentDto = await documentsController.create(accountId, draftBody);
    const issued: DocumentDto = await documentsController.issue(accountId, draft.id, {});
    const refetched: DocumentDto = await documentsController.get(accountId, issued.id);

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
        country: 'NL',
        street: 'Musterstrasse 1',
        postcode: '10115',
        countyRegion: 'BE',
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

  it('rejects a malformed EU field at the HTTP boundary instead of silently dropping it', async () => {
    const account = await db.prisma.account.create({ data: { creditBalanceCents: 1_000_000 } });

    let issuerError: unknown;
    try {
      issuerController.updateProfile(account.id, { country: 'germany' });
    } catch (error) {
      issuerError = error;
    }
    expect((issuerError as DomainError).code).toBe('VALIDATION_FAILED');

    let clientError: unknown;
    try {
      clientsController.create(account.id, { companyName: 'X', peppolScheme: 'not-a-code' });
    } catch (error) {
      clientError = error;
    }
    expect((clientError as DomainError).code).toBe('VALIDATION_FAILED');
  });
});
