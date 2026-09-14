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
    expect(screen.getByLabelText('Град')).toBeTruthy();
    expect(screen.getByLabelText('Държава')).toBeTruthy();
    expect(screen.getByLabelText('Език на документите')).toBeTruthy();
    expect(screen.getByLabelText('Имейл')).toBeTruthy();
    expect(screen.getByLabelText('МОЛ')).toBeTruthy();
    expect(screen.getByLabelText('Peppol идентификатор (Endpoint ID)')).toBeTruthy();
    expect(screen.getByLabelText('Peppol схема')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Отказ' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Запази' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderDialog('en', enMessages);

    expect(screen.getByText('New client')).toBeTruthy();
    expect(screen.getByLabelText('Company name')).toBeTruthy();
    expect(screen.getByLabelText('City')).toBeTruthy();
    expect(screen.getByLabelText('Country')).toBeTruthy();
    expect(screen.getByLabelText('Document language')).toBeTruthy();
    expect(screen.getByLabelText('Peppol endpoint ID')).toBeTruthy();
    expect(screen.getByLabelText('Peppol scheme')).toBeTruthy();
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

  it('switches to structured street/postcode fields for a country that requires them', async () => {
    renderDialog('bg', bgMessages);

    expect(screen.getByLabelText('Адрес')).toBeTruthy();
    expect(screen.queryByLabelText('Улица и номер')).toBeNull();

    fireEvent.click(screen.getByLabelText('Държава'));
    fireEvent.click(within(await screen.findByRole('listbox')).getByText('Германия'));

    expect(screen.queryByLabelText('Адрес')).toBeNull();
    expect(screen.getByLabelText('Улица и номер')).toBeTruthy();
    expect(screen.getByLabelText('Пощенски код')).toBeTruthy();
    expect(screen.getByLabelText('Град')).toBeTruthy();
  });

  it('joins street and postcode into address for backward compatibility on a structured country', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'c1', companyName: 'Beispiel GmbH' }));
    renderDialog('bg', bgMessages);

    fireEvent.change(screen.getByLabelText('Фирма'), { target: { value: 'Beispiel GmbH' } });

    fireEvent.click(screen.getByLabelText('Държава'));
    fireEvent.click(within(await screen.findByRole('listbox')).getByText('Германия'));

    fireEvent.change(screen.getByLabelText('Улица и номер'), {
      target: { value: 'Musterstraße 10' },
    });
    fireEvent.change(screen.getByLabelText('Пощенски код'), { target: { value: '10115' } });
    fireEvent.change(screen.getByLabelText('Град'), { target: { value: 'Berlin' } });

    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [request] = fetchMock.mock.calls[0] as [Request];
    const body = await request.json();
    expect(body.street).toBe('Musterstraße 10');
    expect(body.postcode).toBe('10115');
    expect(body.city).toBe('Berlin');
    expect(body.address).toBe('Musterstraße 10, 10115');
  });

  it('keeps the free-text address for BG and sends city separately', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'c1', companyName: 'ACME' }));
    renderDialog('bg', bgMessages);

    fireEvent.change(screen.getByLabelText('Фирма'), { target: { value: 'ACME' } });
    fireEvent.change(screen.getByLabelText('Адрес'), { target: { value: 'ул. Витоша 15' } });
    fireEvent.change(screen.getByLabelText('Град'), { target: { value: 'София' } });

    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [request] = fetchMock.mock.calls[0] as [Request];
    const body = await request.json();
    expect(body.address).toBe('ул. Витоша 15');
    expect(body.city).toBe('София');
    expect(body.street).toBeNull();
  });

  it('round-trips the Peppol endpoint id and scheme through the request body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'c1', companyName: 'ACME' }));
    renderDialog('bg', bgMessages);

    fireEvent.change(screen.getByLabelText('Фирма'), { target: { value: 'ACME' } });
    fireEvent.change(screen.getByLabelText('Peppol идентификатор (Endpoint ID)'), {
      target: { value: '0088:1234567890123' },
    });
    fireEvent.change(screen.getByLabelText('Peppol схема'), { target: { value: '0088' } });

    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [request] = fetchMock.mock.calls[0] as [Request];
    const body = await request.json();
    expect(body.peppolEndpointId).toBe('0088:1234567890123');
    expect(body.peppolScheme).toBe('0088');
  });

  it('sends null for blank Peppol fields', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'c1', companyName: 'ACME' }));
    renderDialog('bg', bgMessages);

    fireEvent.change(screen.getByLabelText('Фирма'), { target: { value: 'ACME' } });
    fireEvent.click(screen.getByRole('button', { name: 'Запази' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [request] = fetchMock.mock.calls[0] as [Request];
    const body = await request.json();
    expect(body.peppolEndpointId).toBeNull();
    expect(body.peppolScheme).toBeNull();
  });
});
