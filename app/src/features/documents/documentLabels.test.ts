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
      delivery_note: 'Стокова разписка',
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
      delivery_note: 'Delivery note',
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
      delivery_note: 'Lieferschein',
    };
    expect(getDocumentTypeLabel(type, 'de')).toBe(expected[type]);
  });
});

describe('getDocumentTypeLabel — PL correction qualifier', () => {
  it('distinguishes the two correction types in the app while the PDF prints the same legal name for both', () => {
    expect(getDocumentTypeLabel('credit_note', 'pl')).toBe('Faktura korygująca (in minus)');
    expect(getDocumentTypeLabel('debit_note', 'pl')).toBe('Faktura korygująca (in plus)');
  });
});

describe('getDocumentStatusLabel — gender agreement', () => {
  it('defaults to the feminine form with no documentType', () => {
    expect(getDocumentStatusLabel('sent', 'fr')).toBe('Émise');
    expect(getDocumentStatusLabel('paid', 'it')).toBe('PAGATA');
    expect(getDocumentStatusLabel('cancelled', 'es')).toBe('ANULADA');
  });

  it('agrees with a masculine document type (un devis, il preventivo, el presupuesto)', () => {
    expect(getDocumentStatusLabel('sent', 'fr', 'quote')).toBe('Émis');
    expect(getDocumentStatusLabel('paid', 'it', 'quote')).toBe('PAGATO');
    expect(getDocumentStatusLabel('cancelled', 'es', 'quote')).toBe('ANULADO');
  });

  it('agrees with the delivery note in FR, IT, ES, PL and RO', () => {
    expect(getDocumentStatusLabel('cancelled', 'fr', 'delivery_note')).toBe('ANNULÉ');
    expect(getDocumentStatusLabel('sent', 'it', 'delivery_note')).toBe('Emesso');
    expect(getDocumentStatusLabel('paid', 'es', 'delivery_note')).toBe('PAGADO');
    expect(getDocumentStatusLabel('cancelled', 'pl', 'delivery_note')).toBe('ANULOWANY');
    expect(getDocumentStatusLabel('paid', 'pl', 'delivery_note')).toBe('ZAPŁACONO');
    expect(getDocumentStatusLabel('sent', 'ro', 'delivery_note')).toBe('Emis');
  });

  it('agrees with un avoir (FR credit_note is masculine) but not une note de débit', () => {
    expect(getDocumentStatusLabel('paid', 'fr', 'credit_note')).toBe('PAYÉ');
    expect(getDocumentStatusLabel('paid', 'fr', 'debit_note')).toBe('PAYÉE');
  });

  it('never varies for a document type outside that locale’s masculine set', () => {
    expect(getDocumentStatusLabel('paid', 'it', 'invoice')).toBe('PAGATA');
    expect(getDocumentStatusLabel('paid', 'ro', 'quote')).toBe('PLĂTITĂ');
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
