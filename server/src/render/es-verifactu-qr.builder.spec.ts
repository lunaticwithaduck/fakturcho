import { describe, expect, it } from 'vitest';
import { buildVerifactuQr, verifactuQrAmountSign } from './es-verifactu-qr.builder';
import { buildFakeDocument } from './templates/classic/testing/fake-document';

function esDocument(overrides: Record<string, unknown> = {}) {
  return buildFakeDocument({
    documentType: 'INVOICE',
    issuerCountry: 'ES',
    issuerEik: 'B12345674',
    issuerVatNumber: 'ESB12345674',
    number: 15,
    issuedAt: new Date('2026-09-04'),
    amount: 121000,
    ...overrides,
  });
}

describe('buildVerifactuQr', () => {
  it('returns null for a non-ES issuer', async () => {
    const document = esDocument({ issuerCountry: 'PL' });
    expect(await buildVerifactuQr(document, 'invoice', 'PL', false)).toBeNull();
  });

  it('returns null for a draft', async () => {
    const document = esDocument();
    expect(await buildVerifactuQr(document, 'invoice', 'ES', true)).toBeNull();
  });

  it('returns null for a document type that is not a fiscal invoice/rectificativa (e.g. a quote)', async () => {
    const document = esDocument();
    expect(await buildVerifactuQr(document, 'quote', 'ES', false)).toBeNull();
  });

  it('returns null when the document has no issue date yet', async () => {
    const document = esDocument({ issuedAt: null });
    expect(await buildVerifactuQr(document, 'invoice', 'ES', false)).toBeNull();
  });

  it('renders the QR with no legend (fakturcho never remits to AEAT)', async () => {
    const document = esDocument();
    const result = await buildVerifactuQr(document, 'invoice', 'ES', false);
    expect(result).not.toBeNull();
    expect(result?.legend).toBeNull();
    expect(result?.svg).toContain('<svg');
  });

  it('also applies to a credit note (factura rectificativa)', async () => {
    const document = esDocument({ documentType: 'CREDIT_NOTE' });
    const result = await buildVerifactuQr(document, 'credit_note', 'ES', false);
    expect(result).not.toBeNull();
  });

  it('also applies to a debit note (factura rectificativa por cargo)', async () => {
    const document = esDocument({ documentType: 'DEBIT_NOTE' });
    const result = await buildVerifactuQr(document, 'debit_note', 'ES', false);
    expect(result).not.toBeNull();
  });
});

describe('verifactuQrAmountSign', () => {
  it('is negative only for a credit note, matching the printed total', () => {
    expect(verifactuQrAmountSign('credit_note')).toBe(-1);
    expect(verifactuQrAmountSign('invoice')).toBe(1);
    expect(verifactuQrAmountSign('debit_note')).toBe(1);
  });
});
