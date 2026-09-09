// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogueRow } from './CatalogueRow';

const item = {
  id: 'i1',
  name: 'Консултация',
  defaultUnitPrice: 5000,
  unit: 'час',
};

afterEach(cleanup);

describe('CatalogueRow', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <CatalogueRow item={item} onEdit={vi.fn()} onDelete={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Консултация')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Редактирай' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Изтрий' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <CatalogueRow item={item} onEdit={vi.fn()} onDelete={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
