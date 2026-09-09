// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BalanceCard } from './BalanceCard';

afterEach(cleanup);

describe('BalanceCard', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <BalanceCard balance={{ balanceCents: 12345, documentsRemaining: 3 }} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Баланс')).toBeTruthy();
    expect(screen.getByText('123,45 €')).toBeTruthy();
    expect(screen.getByText('още 3 документа')).toBeTruthy();
  });

  it('renders the singular form for one remaining document in Bulgarian', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <BalanceCard balance={{ balanceCents: 10, documentsRemaining: 1 }} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('още 1 документ')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <BalanceCard balance={{ balanceCents: 12345, documentsRemaining: 3 }} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Balance')).toBeTruthy();
    expect(screen.getByText('123,45 €')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
