import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
} from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';

describe('getDocumentTypeLabel', () => {
  it.each(DOCUMENT_TYPES)('renders the Bulgarian label for %s unchanged', (type) => {
    const expected: Record<(typeof DOCUMENT_TYPES)[number], string> = {
      invoice: 'Фактура',
      proforma: 'Проформа фактура',
      credit_note: 'Кредитно известие',
      debit_note: 'Дебитно известие',
      quote: 'Ценова оферта',
    };
    expect(getDocumentTypeLabel(type, 'bg')).toBe(expected[type]);
  });

  it.each(DOCUMENT_TYPES)('renders the English label for %s', (type) => {
    const expected: Record<(typeof DOCUMENT_TYPES)[number], string> = {
      invoice: 'Invoice',
      proforma: 'Proforma invoice',
      credit_note: 'Credit note',
      debit_note: 'Debit note',
      quote: 'Quote',
    };
    expect(getDocumentTypeLabel(type, 'en')).toBe(expected[type]);
  });

  it.each(DOCUMENT_TYPES)('renders a non-English, non-Bulgarian label for %s', (type) => {
    const expected: Record<(typeof DOCUMENT_TYPES)[number], string> = {
      invoice: 'Rechnung',
      proforma: 'Proforma-Rechnung',
      credit_note: 'Rechnungskorrektur',
      debit_note: 'Belastungsanzeige',
      quote: 'Angebot',
    };
    expect(getDocumentTypeLabel(type, 'de')).toBe(expected[type]);
  });
});

describe('getDocumentStatusLabel', () => {
  it.each(DOCUMENT_STATUSES)('renders the Bulgarian label for %s unchanged', (status) => {
    const expected: Record<(typeof DOCUMENT_STATUSES)[number], string> = {
      draft: 'Чернова',
      sent: 'Издадена',
      paid: 'ПЛАТЕНО',
      overdue: 'ПРОСРОЧЕНА',
      cancelled: 'АНУЛИРАНА',
    };
    expect(getDocumentStatusLabel(status, 'bg')).toBe(expected[status]);
  });

  it.each(DOCUMENT_STATUSES)('renders the English label for %s', (status) => {
    const expected: Record<(typeof DOCUMENT_STATUSES)[number], string> = {
      draft: 'Draft',
      sent: 'Issued',
      paid: 'PAID',
      overdue: 'OVERDUE',
      cancelled: 'CANCELLED',
    };
    expect(getDocumentStatusLabel(status, 'en')).toBe(expected[status]);
  });

  it.each(DOCUMENT_STATUSES)('renders a non-English, non-Bulgarian label for %s', (status) => {
    const expected: Record<(typeof DOCUMENT_STATUSES)[number], string> = {
      draft: 'Borrador',
      sent: 'Emitida',
      paid: 'PAGADA',
      overdue: 'VENCIDA',
      cancelled: 'ANULADA',
    };
    expect(getDocumentStatusLabel(status, 'es')).toBe(expected[status]);
  });
});
