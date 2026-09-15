// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentStatusTabs } from './DocumentStatusTabs';

afterEach(cleanup);

describe('DocumentStatusTabs', () => {
  it('renders the Bulgarian "all" tab unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentStatusTabs value="all" onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('tab', { name: 'Всички' })).toBeTruthy();
  });

  it('resolves the English messages for the same key without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentStatusTabs value="all" onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('tab', { name: 'All' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('renders the Bulgarian status tab labels unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentStatusTabs value="all" onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('tab', { name: 'Чернова' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Издадена' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'ПЛАТЕНО' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'ПРОСРОЧЕНА' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'АНУЛИРАНА' })).toBeTruthy();
  });

  it('renders English status tab labels instead of Bulgarian when the locale is English', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentStatusTabs value="all" onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('tab', { name: 'Draft' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Issued' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'PAID' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'OVERDUE' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'CANCELLED' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Чернова' })).toBeNull();
  });
});
