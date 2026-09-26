// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClientRow } from './ClientRow';

const client = {
  id: 'c1',
  companyName: 'ACME EOOD',
  eik: '123456789',
  vatNumber: null,
  address: null,
  street: null,
  postcode: null,
  countyRegion: null,
  city: null,
  country: 'BG',
  documentLanguage: null,
  email: 'office@acme.bg',
  mol: null,
  peppolEndpointId: null,
  peppolScheme: null,
  sdiRecipientCode: null,
  pec: null,
  clientType: null,
};

afterEach(cleanup);

describe('ClientRow', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ClientRow client={client} onEdit={vi.fn()} onDelete={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('ACME EOOD')).toBeTruthy();
    expect(screen.getByText('ЕИК / Булстат: 123456789 · office@acme.bg')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Редактирай' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Изтрий' })).toBeTruthy();
  });

  it("labels a foreign client's ID by the client's country, not the viewer's", () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ClientRow client={{ ...client, country: 'FR' }} onEdit={vi.fn()} onDelete={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('SIREN: 123456789 · office@acme.bg')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ClientRow client={client} onEdit={vi.fn()} onDelete={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('shows a readable Latin label for a BG client on a non-bg UI', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ClientRow client={client} onEdit={vi.fn()} onDelete={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('UIC / BULSTAT: 123456789 · office@acme.bg')).toBeTruthy();
  });

  it('shows the client-country identifier acronym rather than the viewer-locale generic label', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ClientRow
          client={{ ...client, country: 'FR', eik: '552100554' }}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('SIREN: 552100554 · office@acme.bg')).toBeTruthy();
  });
});
