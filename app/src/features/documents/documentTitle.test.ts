import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { type DocumentTitleTranslator, formatDocumentTitle } from './documentTitle';

const bgT = createTranslator({
  locale: 'bg',
  messages: bgMessages,
  namespace: 'documents.title',
}) as DocumentTitleTranslator;
const enT = createTranslator({
  locale: 'en',
  messages: enMessages,
  namespace: 'documents.title',
}) as DocumentTitleTranslator;

describe('formatDocumentTitle', () => {
  it('renders a draft without a number as a draft label (default fallback, unchanged)', () => {
    expect(
      formatDocumentTitle({
        documentType: 'invoice',
        number: null,
        numberPrefix: null,
        numberSuffix: null,
      }),
    ).toBe('Фактура — чернова');
  });

  it('marks a tax document as (Оригинал) (default fallback, unchanged)', () => {
    expect(
      formatDocumentTitle({
        documentType: 'invoice',
        number: 16,
        numberPrefix: null,
        numberSuffix: null,
      }),
    ).toBe('Фактура № 0000000016 (Оригинал)');
  });

  it('does not mark a proforma or a quote (default fallback, unchanged)', () => {
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

  it('includes the prefix and suffix around the padded number (default fallback, unchanged)', () => {
    expect(
      formatDocumentTitle({
        documentType: 'credit_note',
        number: 5,
        numberPrefix: 'A-',
        numberSuffix: '/2026',
      }),
    ).toBe('Кредитно известие № A-0000000005/2026 (Оригинал)');
  });

  it('renders byte-identical Bulgarian when driven by the bg.json translator', () => {
    expect(
      formatDocumentTitle(
        { documentType: 'invoice', number: null, numberPrefix: null, numberSuffix: null },
        bgT,
      ),
    ).toBe('Фактура — чернова');
    expect(
      formatDocumentTitle(
        { documentType: 'invoice', number: 16, numberPrefix: null, numberSuffix: null },
        bgT,
      ),
    ).toBe('Фактура № 0000000016 (Оригинал)');
  });

  it('resolves cleanly with the en.json translator', () => {
    expect(
      formatDocumentTitle(
        { documentType: 'invoice', number: null, numberPrefix: null, numberSuffix: null },
        enT,
      ),
    ).toBe('Фактура — draft');
    expect(
      formatDocumentTitle(
        { documentType: 'invoice', number: 16, numberPrefix: null, numberSuffix: null },
        enT,
      ),
    ).toBe('Фактура No. 0000000016 (Original)');
  });
});
