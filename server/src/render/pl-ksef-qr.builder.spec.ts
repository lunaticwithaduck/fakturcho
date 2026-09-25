import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { buildKsefQr } from './pl-ksef-qr.builder';
import { buildFakeDocument, buildFakeLineItems } from './templates/classic/testing/fake-document';

function plReadyDocument(overrides: Record<string, unknown> = {}) {
  return buildFakeDocument({
    documentType: 'INVOICE',
    issuerCountry: 'PL',
    issuerCompanyName: 'Testowa Spółka z o.o.',
    issuerEik: '1234563218',
    issuerVatNumber: 'PL1234563218',
    issuerStreet: 'ul. Testowa 1',
    issuerPostcode: '00-001',
    issuerCity: 'Warszawa',
    recipientCompanyName: 'Klient Testowy Sp. z o.o.',
    recipientCountry: 'PL',
    recipientEik: '5260001246',
    recipientVatNumber: 'PL5260001246',
    number: 12,
    issuedAt: new Date('2026-09-05'),
    ksefNumber: null,
    ...overrides,
  });
}

function fakePrismaFor(document: ReturnType<typeof plReadyDocument>): PrismaService {
  const record = {
    ...document,
    lineItems: buildFakeLineItems(),
    discounts: [],
    originalDocument: null,
  };
  return {
    document: { findFirst: vi.fn().mockResolvedValue(record) },
  } as unknown as PrismaService;
}

describe('buildKsefQr', () => {
  it('returns null for a non-PL issuer', async () => {
    const document = plReadyDocument({ issuerCountry: 'BG' });
    const result = await buildKsefQr(
      fakePrismaFor(document),
      'acc_1',
      document,
      'invoice',
      'BG',
      false,
    );
    expect(result).toBeNull();
  });

  it('returns null for a draft', async () => {
    const document = plReadyDocument();
    const result = await buildKsefQr(
      fakePrismaFor(document),
      'acc_1',
      document,
      'invoice',
      'PL',
      true,
    );
    expect(result).toBeNull();
  });

  it('returns null for a document type with no FA(3) export (e.g. a quote)', async () => {
    const document = plReadyDocument();
    const result = await buildKsefQr(
      fakePrismaFor(document),
      'acc_1',
      document,
      'quote',
      'PL',
      false,
    );
    expect(result).toBeNull();
  });

  it('returns null when the document is not FA(3)-ready (missing issuer NIP)', async () => {
    const document = plReadyDocument({ issuerEik: null, issuerVatNumber: null });
    const result = await buildKsefQr(
      fakePrismaFor(document),
      'acc_1',
      document,
      'invoice',
      'PL',
      false,
    );
    expect(result).toBeNull();
  });

  it('renders no KOD I until a KSeF number is set, since an offline invoice also needs KOD II', async () => {
    const document = plReadyDocument();
    const result = await buildKsefQr(
      fakePrismaFor(document),
      'acc_1',
      document,
      'invoice',
      'PL',
      false,
    );
    expect(result).toBeNull();
  });

  it('renders KOD I labelled with the pasted KSeF number once set', async () => {
    const ksefNumber = '1234563218-20260905-010203ABCDEF-4A5B6C-7D';
    const document = plReadyDocument({ ksefNumber });
    const result = await buildKsefQr(
      fakePrismaFor(document),
      'acc_1',
      document,
      'invoice',
      'PL',
      false,
    );
    expect(result?.label).toBe(ksefNumber);
  });
});
