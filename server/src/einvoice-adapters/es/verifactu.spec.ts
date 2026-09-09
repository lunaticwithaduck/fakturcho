import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { esDomesticStandardInvoice } from './__fixtures__/es-domestic-standard';
import { MockVerifactuReporter } from './verifactu';

describe('MockVerifactuReporter.reportInvoice — accepted', () => {
  it('accepts a fully populated ES invoice with a verifactuId and a qrCode', async () => {
    const reporter = new MockVerifactuReporter();
    const result = await reporter.reportInvoice(esDomesticStandardInvoice);

    expect(result.status).toBe('accepted');
    expect(result.verifactuId).toBeDefined();
    expect(result.qrCode).toBeDefined();
    expect(result.qrCode).toContain('nif=B12345674');
    expect(result.qrCode).toContain('importe=1210.00');
  });

  it('is deterministic — the same document reports the same verifactuId and qrCode', async () => {
    const reporter = new MockVerifactuReporter();
    const first = await reporter.reportInvoice(esDomesticStandardInvoice);
    const second = await reporter.reportInvoice({ ...esDomesticStandardInvoice });

    expect(first.verifactuId).toBe(second.verifactuId);
    expect(first.qrCode).toBe(second.qrCode);
  });

  it('produces a different verifactuId for a different invoice amount', async () => {
    const reporter = new MockVerifactuReporter();
    const other: DocumentDto = { ...esDomesticStandardInvoice, amount: 999900 };
    const first = await reporter.reportInvoice(esDomesticStandardInvoice);
    const second = await reporter.reportInvoice(other);

    expect(first.verifactuId).not.toBe(second.verifactuId);
  });
});

describe('MockVerifactuReporter.reportInvoice — rejected', () => {
  it('rejects a document with no issuer NIF/CIF', async () => {
    const reporter = new MockVerifactuReporter();
    const noNif: DocumentDto = {
      ...esDomesticStandardInvoice,
      issuer: { ...esDomesticStandardInvoice.issuer, eik: null },
    };
    const result = await reporter.reportInvoice(noNif);

    expect(result.status).toBe('rejected');
    expect(result.errorText).toBeDefined();
    expect(result.verifactuId).toBeUndefined();
    expect(result.qrCode).toBeUndefined();
  });

  it('rejects an unissued document (no number, no issue date)', async () => {
    const reporter = new MockVerifactuReporter();
    const draft: DocumentDto = { ...esDomesticStandardInvoice, number: null, issuedAt: null };
    const result = await reporter.reportInvoice(draft);

    expect(result.status).toBe('rejected');
  });
});
