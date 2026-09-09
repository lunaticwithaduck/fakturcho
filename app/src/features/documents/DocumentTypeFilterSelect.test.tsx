// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentTypeFilterSelect } from './DocumentTypeFilterSelect';

afterEach(cleanup);

describe('DocumentTypeFilterSelect', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentTypeFilterSelect value="all" onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Вид документ')).toBeTruthy();
    expect(screen.getByText('Всички видове')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentTypeFilterSelect value="all" onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Document type')).toBeTruthy();
    expect(screen.getByText('All types')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
