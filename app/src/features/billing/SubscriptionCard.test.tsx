// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { SubscriptionDto } from '@shared/types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionCard } from './SubscriptionCard';

afterEach(cleanup);

const activeSubscription: SubscriptionDto = {
  id: 's1',
  status: 'active',
  planId: 'p1',
  tier: 'sub5',
  currentPeriodEnd: '2026-02-01',
};

const pastDueSubscription: SubscriptionDto = {
  id: 's2',
  status: 'past_due',
  planId: 'p1',
  tier: 'sub5',
  currentPeriodEnd: null,
};

const activeWithPendingUpgrade: SubscriptionDto = {
  ...activeSubscription,
  pendingUpgrade: { tier: 'sub10', checkoutUrl: 'https://checkout.revolut.com/pay/ord_upgrade' },
};

describe('SubscriptionCard', () => {
  it('renders an active subscription with switch options in Bulgarian', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <SubscriptionCard
          subscription={activeSubscription}
          pendingProduct={null}
          onSelectTier={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Абонамент')).toBeTruthy();
    expect(screen.getByText('100 документа на месец за 5,00 €')).toBeTruthy();
    expect(screen.getByText('Текущият период изтича на 01.02.2026')).toBeTruthy();
    expect(screen.getByText('Следващото зареждане: 10,00 € кредит')).toBeTruthy();
    expect(screen.getByText('Смени на')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Смени' })).toHaveLength(2);
  });

  it('shows a pending upgrade with a continue-to-payment action and hides it from the switch grid', () => {
    const onSelectTier = vi.fn();
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <SubscriptionCard
          subscription={activeWithPendingUpgrade}
          pendingProduct={null}
          onSelectTier={onSelectTier}
        />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByText('Предстояща смяна, чака плащане: 200 документа на месец за 10,00 €'),
    ).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Продължи към плащане' })).toHaveLength(1);
    // sub10 is the pending upgrade, so it must not also show up as a plain "switch to" option
    expect(screen.getAllByRole('button', { name: 'Смени' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Продължи към плащане' }));
    expect(onSelectTier).toHaveBeenCalledWith('sub10');
  });

  it('renders the status line for a non-usable subscription in Bulgarian', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <SubscriptionCard
          subscription={pastDueSubscription}
          pendingProduct={null}
          onSelectTier={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Абонамент: Просрочено плащане')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Активирай' })).toHaveLength(3);
  });

  it('renders the tier grid with no subscription in Bulgarian', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <SubscriptionCard subscription={null} pendingProduct={null} onSelectTier={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getAllByRole('button', { name: 'Активирай' })).toHaveLength(3);
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SubscriptionCard
          subscription={activeSubscription}
          pendingProduct={null}
          onSelectTier={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Subscription')).toBeTruthy();
    expect(screen.getByText('Switch to')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Switch' })).toHaveLength(2);
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
