// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentPdfViewer } from './DocumentPdfViewer';

vi.mock('@app/api', () => ({
  getDocumentPreviewUrl: (id: string) => `/api/documents/${id}/render?disposition=inline`,
  getDocumentRenderUrl: (id: string) => `/api/documents/${id}/render`,
}));

afterEach(cleanup);

describe('DocumentPdfViewer', () => {
  it('renders the Bulgarian draft notice unchanged for a draft', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentPdfViewer
          documentId="doc-1"
          title="Фактура — чернова"
          status="draft"
          updatedAt="2026-09-01T00:00:00.000Z"
        />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByText(
        'Черновата се показва само като преглед с воден знак. Издайте документа, за да го изтеглите или изпратите.',
      ),
    ).toBeTruthy();
  });

  it('renders the Bulgarian download label unchanged for an issued document', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentPdfViewer
          documentId="doc-1"
          title="Фактура № 0000000016"
          status="sent"
          updatedAt="2026-09-01T00:00:00.000Z"
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Изтегли PDF' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentPdfViewer
          documentId="doc-1"
          title="Invoice No. 0000000016"
          status="sent"
          updatedAt="2026-09-01T00:00:00.000Z"
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Download PDF' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
