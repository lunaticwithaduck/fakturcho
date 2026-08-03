import { describe, expect, it } from 'vitest';
import { formatDocumentTitle } from './documentTitle';

describe('formatDocumentTitle', () => {
  it('renders a draft without a number as a draft label', () => {
    expect(
      formatDocumentTitle({
        documentType: 'invoice',
        number: null,
        numberPrefix: null,
        numberSuffix: null,
      }),
    ).toBe('Фактура — чернова');
  });

  it('marks a tax document as (Оригинал)', () => {
    expect(
      formatDocumentTitle({
        documentType: 'invoice',
        number: 16,
        numberPrefix: null,
        numberSuffix: null,
      }),
    ).toBe('Фактура № 0000000016 (Оригинал)');
  });

  it('does not mark a proforma or a quote', () => {
    expect(
      formatDocumentTitle({
        documentType: 'proforma',
        number: 3,
        numberPrefix: null,
        numberSuffix: null,
      }),
    ).toBe('Проформа фактура № 0000000003');
    expect(
      formatDocumentTitle({
        documentType: 'quote',
        number: 3,
        numberPrefix: null,
        numberSuffix: null,
      }),
    ).toBe('Ценова оферта № 0000000003');
  });

  it('includes the prefix and suffix around the padded number', () => {
    expect(
      formatDocumentTitle({
        documentType: 'credit_note',
        number: 5,
        numberPrefix: 'A-',
        numberSuffix: '/2026',
      }),
    ).toBe('Кредитно известие № A-0000000005/2026 (Оригинал)');
  });
});
