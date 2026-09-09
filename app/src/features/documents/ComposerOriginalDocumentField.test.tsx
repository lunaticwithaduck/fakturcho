// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { DocumentListItemDto } from '@shared/types';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ComposerOriginalDocumentField } from './ComposerOriginalDocumentField';

const draftDocument: DocumentListItemDto = {
  id: 'doc-draft',
  documentType: 'invoice',
  status: 'sent',
  number: null,
  numberPrefix: null,
  numberSuffix: null,
  recipientCompanyName: 'ACME EOOD',
  issuedAt: null,
  dueAt: null,
  amount: 1000,
  currency: 'EUR',
  createdAt: '2026-09-01T00:00:00.000Z',
};

const numberedDocument: DocumentListItemDto = {
  ...draftDocument,
  id: 'doc-numbered',
  number: 42,
  recipientCompanyName: 'Beta OOD',
};

let listResult: { data: { items: DocumentListItemDto[]; total: number } } = {
  data: { items: [draftDocument, numberedDocument], total: 2 },
};

vi.mock('@app/api', () => ({
  useListDocumentsQuery: () => listResult,
}));

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  listResult = { data: { items: [draftDocument, numberedDocument], total: 2 } };
});

function renderField(locale: 'bg' | 'en', messages: typeof bgMessages) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ComposerOriginalDocumentField
        value={null}
        currentDocumentId={null}
        hasError={false}
        onChange={vi.fn()}
      />
    </NextIntlClientProvider>,
  );
}

function openOptions(labelText: string) {
  fireEvent.click(screen.getByLabelText(labelText));
  return screen.findByRole('listbox');
}

describe('ComposerOriginalDocumentField', () => {
  it('renders the Bulgarian option labels unchanged', async () => {
    renderField('bg', bgMessages);

    const listbox = await openOptions('Оригинален документ');

    expect(within(listbox).getByText('Фактура — чернова — ACME EOOD')).toBeTruthy();
    expect(within(listbox).getByText('Фактура № 0000000042 (Оригинал) — Beta OOD')).toBeTruthy();
  });

  it('renders the English option labels instead of the Bulgarian fallback', async () => {
    renderField('en', enMessages);

    const listbox = await openOptions('Original document');

    expect(within(listbox).getByText('Фактура — draft — ACME EOOD')).toBeTruthy();
    expect(within(listbox).getByText('Фактура No. 0000000042 (Original) — Beta OOD')).toBeTruthy();
  });
});
