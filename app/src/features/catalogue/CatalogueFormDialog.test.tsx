// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogueFormDialog } from './CatalogueFormDialog';

vi.mock('@app/api', () => ({
  useCreateCatalogueItemMutation: () => [vi.fn(), { isLoading: false }],
  useUpdateCatalogueItemMutation: () => [vi.fn(), { isLoading: false }],
}));

afterEach(cleanup);

describe('CatalogueFormDialog', () => {
  it('renders the Bulgarian copy unchanged for a new item', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <CatalogueFormDialog item={null} onOpenChange={vi.fn()} onSaved={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Нов артикул')).toBeTruthy();
    expect(screen.getByLabelText('Наименование')).toBeTruthy();
    expect(screen.getByLabelText('Мярка')).toBeTruthy();
    expect(screen.getByPlaceholderText('бр., час, кг...')).toBeTruthy();
    expect((screen.getByLabelText('Мярка') as HTMLInputElement).value).toBe('бр.');
    expect(screen.getByRole('button', { name: 'Отказ' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Запази' })).toBeTruthy();
  });

  it('shows the Bulgarian validation error when required fields are empty', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <CatalogueFormDialog item={null} onOpenChange={vi.fn()} onSaved={vi.fn()} />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    expect(screen.getByText('Попълнете наименование, мярка и цена.')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <CatalogueFormDialog item={null} onOpenChange={vi.fn()} onSaved={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('New item')).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect((screen.getByLabelText('Unit') as HTMLInputElement).value).toBe('pcs');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
