// @vitest-environment jsdom
import { apiSlice } from '@app/api';
import { installFetchMock, jsonResponse } from '@app/api/base/testFetchMock';
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { configureStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientFormDialog } from './ClientFormDialog';

function createTestStore() {
  return configureStore({
    reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });
}

function renderDialog(locale: 'bg' | 'en', messages: typeof bgMessages) {
  return render(
    <Provider store={createTestStore()}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ClientFormDialog client={null} onOpenChange={vi.fn()} onSaved={vi.fn()} />
      </NextIntlClientProvider>
    </Provider>,
  );
}

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('ClientFormDialog', () => {
  let fetchMock: ReturnType<typeof installFetchMock>;

  beforeEach(() => {
    fetchMock = installFetchMock();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the Bulgarian copy unchanged for a new client', () => {
    renderDialog('bg', bgMessages);

    expect(screen.getByText('Нов клиент')).toBeTruthy();
    expect(screen.getByLabelText('Фирма')).toBeTruthy();
    expect(screen.getByLabelText('ЕИК / Булстат')).toBeTruthy();
    expect(screen.getByLabelText('ДДС номер')).toBeTruthy();
    expect(screen.getByLabelText('Адрес')).toBeTruthy();
    expect(screen.getByLabelText('Държава')).toBeTruthy();
    expect(screen.getByLabelText('Език на документите')).toBeTruthy();
    expect(screen.getByLabelText('Имейл')).toBeTruthy();
    expect(screen.getByLabelText('МОЛ')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Отказ' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Запази' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderDialog('en', enMessages);

    expect(screen.getByText('New client')).toBeTruthy();
    expect(screen.getByLabelText('Company name')).toBeTruthy();
    expect(screen.getByLabelText('Country')).toBeTruthy();
    expect(screen.getByLabelText('Document language')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('defaults the country to BG and the document language to "same as issuer"', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'c1', companyName: 'ACME' }));
    renderDialog('bg', bgMessages);

    fireEvent.change(screen.getByLabelText('Фирма'), { target: { value: 'ACME' } });
    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [request] = fetchMock.mock.calls[0] as [Request];
    const body = await request.json();
    expect(body.country).toBe('BG');
    expect(body.documentLanguage).toBeNull();
  });

  it('sends the selected country and document language on submit', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'c1', companyName: 'ACME' }));
    renderDialog('bg', bgMessages);

    fireEvent.change(screen.getByLabelText('Фирма'), { target: { value: 'ACME' } });

    fireEvent.click(screen.getByLabelText('Държава'));
    fireEvent.click(within(await screen.findByRole('listbox')).getByText('Германия'));

    fireEvent.click(screen.getByLabelText('Език на документите'));
    fireEvent.click(within(await screen.findByRole('listbox')).getByText('Английски'));

    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [request] = fetchMock.mock.calls[0] as [Request];
    const body = await request.json();
    expect(body.country).toBe('DE');
    expect(body.documentLanguage).toBe('en');
  });
});
