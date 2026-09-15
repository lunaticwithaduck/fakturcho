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
    expect(screen.getByText('ЕИК: 123456789 · office@acme.bg')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Редактирай' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Изтрий' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ClientRow client={client} onEdit={vi.fn()} onDelete={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('EIK: 123456789 · office@acme.bg')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
