// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { DocumentListItemDto } from '@shared/types';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentListItemCard } from './DocumentListItemCard';

afterEach(cleanup);

const withClient: DocumentListItemDto = {
  id: 'doc-1',
  documentType: 'invoice',
  status: 'draft',
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

const withoutClient: DocumentListItemDto = { ...withClient, recipientCompanyName: null };

describe('DocumentListItemCard', () => {
  it('renders the Bulgarian copy unchanged, including the title and no-client fallback', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentListItemCard document={withoutClient} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Фактура — чернова')).toBeTruthy();
    expect(screen.getByText('Без клиент')).toBeTruthy();
  });

  it('renders the recipient company name when present', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentListItemCard document={withClient} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('ACME EOOD')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentListItemCard document={withoutClient} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('No client')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
