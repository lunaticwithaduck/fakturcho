import { describe, expect, it } from 'vitest';
import { buildDocumentSubject } from './subject-templates';

describe('buildDocumentSubject', () => {
  it('matches the existing Bulgarian wording byte-for-byte', () => {
    expect(buildDocumentSubject('bg', 'invoice', '0000000016')).toBe('Фактура № 0000000016');
    expect(buildDocumentSubject('bg', 'proforma', '0000000001')).toBe(
      'Проформа фактура № 0000000001',
    );
    expect(buildDocumentSubject('bg', 'credit_note', '0000000002')).toBe(
      'Кредитно известие № 0000000002',
    );
    expect(buildDocumentSubject('bg', 'debit_note', '0000000003')).toBe(
      'Дебитно известие № 0000000003',
    );
    expect(buildDocumentSubject('bg', 'quote', '0000000004')).toBe('Ценова оферта № 0000000004');
  });

  it('builds the English equivalent', () => {
    expect(buildDocumentSubject('en', 'invoice', '0000000016')).toBe('Invoice No. 0000000016');
    expect(buildDocumentSubject('en', 'credit_note', '0000000002')).toBe(
      'Credit note No. 0000000002',
    );
    expect(buildDocumentSubject('en', 'debit_note', '0000000003')).toBe(
      'Debit note No. 0000000003',
    );
  });

  it('returns the bare label when there is no formatted number', () => {
    expect(buildDocumentSubject('bg', 'invoice', null)).toBe('Фактура');
    expect(buildDocumentSubject('en', 'invoice', null)).toBe('Invoice');
  });

  it('builds the German equivalent', () => {
    expect(buildDocumentSubject('de', 'invoice', '0000000016')).toBe('Rechnung Nr. 0000000016');
    expect(buildDocumentSubject('de', 'credit_note', '0000000002')).toBe(
      'Rechnungskorrektur Nr. 0000000002',
    );
    expect(buildDocumentSubject('de', 'debit_note', '0000000003')).toBe(
      'Belastungsanzeige Nr. 0000000003',
    );
    expect(buildDocumentSubject('de', 'invoice', null)).toBe('Rechnung');
  });
});
