// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { CreditLedgerEntryDto } from '@shared/types';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LedgerSection } from './LedgerSection';

afterEach(cleanup);

const entries: CreditLedgerEntryDto[] = [
  {
    id: '1',
    amountCents: 100,
    reason: 'signup_grant',
    documentId: null,
    createdAt: '2026-01-05',
  },
  {
    id: '2',
    amountCents: -10,
    reason: 'issuance',
    documentId: 'doc-1',
    createdAt: '2026-01-06',
  },
];

describe('LedgerSection', () => {
  it('renders entries with Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <LedgerSection entries={entries} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Последни движения')).toBeTruthy();
    expect(screen.getByText('Начален бонус')).toBeTruthy();
    expect(screen.getByText('Издаден документ')).toBeTruthy();
  });

  it('renders the empty state in Bulgarian', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <LedgerSection entries={[]} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Няма движения')).toBeTruthy();
    expect(
      screen.getByText(
        'Тук ще виждате всяка промяна по баланса ви — бонуси, покупки и издадени документи.',
      ),
    ).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LedgerSection entries={[]} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Recent activity')).toBeTruthy();
    expect(screen.getByText('No activity yet')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
