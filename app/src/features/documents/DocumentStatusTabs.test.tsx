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
});
