// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogueListPage } from './CatalogueListPage';

vi.mock('@app/api', () => ({
  useListCatalogueItemsQuery: () => ({ data: [], isLoading: false }),
  useDeleteCatalogueItemMutation: () => [vi.fn(), { isLoading: false }],
}));

afterEach(cleanup);

describe('CatalogueListPage', () => {
  it('renders the Bulgarian copy unchanged for the empty state', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <CatalogueListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Каталог' })).toBeTruthy();
    expect(screen.getAllByText('Нов артикул').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Търсене по наименование')).toBeTruthy();
    expect(screen.getByText('Нямате артикули')).toBeTruthy();
    expect(
      screen.getByText('Добавете продукт или услуга, за да ги предлагате бързо в документите си.'),
    ).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <CatalogueListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Catalogue' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Search by name')).toBeTruthy();
    expect(screen.getByText('No items yet')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
