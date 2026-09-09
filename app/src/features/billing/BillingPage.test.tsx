// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BillingPage } from './BillingPage';

const balance = { balanceCents: 1000, documentsRemaining: 10 };
const ledger = [
  {
    id: '1',
    amountCents: 100,
    reason: 'signup_grant',
    documentId: null,
    createdAt: '2026-01-05',
  },
];

vi.mock('@app/api', () => ({
  useGetCreditBalanceQuery: () => ({ data: balance, isLoading: false }),
  useGetCreditLedgerQuery: () => ({ data: ledger, isLoading: false }),
  useGetSubscriptionQuery: () => ({ data: null, isLoading: false }),
  useCreateCheckoutMutation: () => [vi.fn()],
}));

afterEach(cleanup);

describe('BillingPage', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <BillingPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Билинг' })).toBeTruthy();
    expect(screen.getByText('Баланс')).toBeTruthy();
    expect(screen.getByText('още 10 документа')).toBeTruthy();
    expect(screen.getByText('Пакети кредити')).toBeTruthy();
    expect(screen.getByText('Последни движения')).toBeTruthy();
    expect(screen.getByText('Начален бонус')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <BillingPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Billing' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
