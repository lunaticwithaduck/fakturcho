// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import esMessages from '@messages/es.json';
import roMessages from '@messages/ro.json';
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

  it('names the page "Sold și abonament" in Romanian, not the loan-ambiguous "Credite"', () => {
    render(
      <NextIntlClientProvider locale="ro" messages={roMessages}>
        <BillingPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Sold și abonament' })).toBeTruthy();
  });

  it('names the page "Saldo y suscripción" in Spanish, distinct from Facturación', () => {
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <BillingPage />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Saldo y suscripción' })).toBeTruthy();
  });
});
