import { describe, expect, it } from 'vitest';
import { buildAsciiFallbackFilename, buildDownloadFilename } from './content-disposition';

describe('buildDownloadFilename', () => {
  it('uses the Bulgarian type label for bg', () => {
    expect(buildDownloadFilename('invoice', false, 16, 'bg')).toBe('Фактура_0000000016.pdf');
    expect(buildDownloadFilename('credit_note', true, null, 'bg')).toBe(
      'Кредитно известие_Чернова.pdf',
    );
  });

  it('uses the English type label for en', () => {
    expect(buildDownloadFilename('invoice', false, 16, 'en')).toBe('Invoice_0000000016.pdf');
    expect(buildDownloadFilename('credit_note', true, null, 'en')).toBe('Credit note_Draft.pdf');
  });
});

describe('buildAsciiFallbackFilename', () => {
  it('falls back to a numbered ascii name', () => {
    expect(buildAsciiFallbackFilename('Invoice_0000000016.pdf')).toBe('document_0000000016.pdf');
  });

  it('falls back to draft for either locale marker', () => {
    expect(buildAsciiFallbackFilename('Фактура_Чернова.pdf')).toBe('document_draft.pdf');
    expect(buildAsciiFallbackFilename('Invoice_Draft.pdf')).toBe('document_draft.pdf');
  });
});
