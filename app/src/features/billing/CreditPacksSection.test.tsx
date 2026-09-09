// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreditPacksSection } from './CreditPacksSection';

afterEach(cleanup);

describe('CreditPacksSection', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <CreditPacksSection pendingProduct={null} onBuy={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Пакети кредити')).toBeTruthy();
    expect(screen.getByText('50 документа')).toBeTruthy();
    expect(screen.getByText('100 документа')).toBeTruthy();
    expect(screen.getByText('250 документа')).toBeTruthy();
    expect(screen.getAllByText('0,10 € на документ')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Купи' })).toHaveLength(3);
  });

  it('shows the redirecting label for the pending pack in Bulgarian', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <CreditPacksSection pendingProduct="pack10" onBuy={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('button', { name: 'Пренасочване...' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Купи' })).toHaveLength(2);
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <CreditPacksSection pendingProduct={null} onBuy={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Credit packs')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Buy' })).toHaveLength(3);
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
