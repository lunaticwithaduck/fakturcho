// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientsListPage } from './ClientsListPage';

vi.mock('@app/api', () => ({
  useListClientsQuery: () => ({ data: [], isLoading: false }),
  useDeleteClientMutation: () => [vi.fn(), { isLoading: false }],
}));

afterEach(cleanup);

describe('ClientsListPage', () => {
  it('renders the Bulgarian copy unchanged for the empty state', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ClientsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Клиенти' })).toBeTruthy();
    expect(screen.getAllByText('Нов клиент').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Търсене по фирма или ЕИК')).toBeTruthy();
    expect(screen.getByText('Нямате клиенти')).toBeTruthy();
    expect(
      screen.getByText(
        'Добавете първия си клиент, за да го използвате при съставяне на документи.',
      ),
    ).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ClientsListPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Clients' })).toBeTruthy();
    expect(screen.getByPlaceholderText('Search by company or EIK')).toBeTruthy();
    expect(screen.getByText('No clients yet')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
