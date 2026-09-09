// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentsListPage } from './DocumentsListPage';

vi.mock('@app/api', () => ({
  useListDocumentsQuery: () => ({ data: { items: [], total: 0 }, isLoading: false }),
}));

afterEach(cleanup);

describe('DocumentsListPage', () => {
  it('renders the Bulgarian copy unchanged for the empty state', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Документи' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Нов документ' }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Търсене')).toBeTruthy();
    expect(screen.getByPlaceholderText('Търсене по клиент или референция')).toBeTruthy();
    expect(screen.getByText('Нямате документи')).toBeTruthy();
    expect(screen.getByText('Създайте първия си документ, за да го видите тук.')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Documents' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'New document' }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Search')).toBeTruthy();
    expect(screen.getByText('You have no documents')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
