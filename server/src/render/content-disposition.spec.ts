import { describe, expect, it } from 'vitest';
import {
  buildAsciiFallbackFilename,
  buildContentDisposition,
  buildDownloadFilename,
} from './content-disposition';

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

describe('buildContentDisposition', () => {
  it('percent-encodes parentheses that encodeURIComponent leaves bare', () => {
    const header = buildContentDisposition(
      'Factura rectificativa (abono)_0000000001.pdf',
      'document_0000000001.pdf',
    );
    expect(header).toBe(
      'attachment; filename="document_0000000001.pdf"; filename*=UTF-8\'\'Factura%20rectificativa%20%28abono%29_0000000001.pdf',
    );
  });

  it('supports the inline disposition for drafts', () => {
    const header = buildContentDisposition('Invoice_Draft.pdf', 'document_draft.pdf', 'inline');
    expect(header).toBe(
      'inline; filename="document_draft.pdf"; filename*=UTF-8\'\'Invoice_Draft.pdf',
    );
  });
});
